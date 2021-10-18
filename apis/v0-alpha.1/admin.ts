import type { FastifyPluginAsync } from 'fastify';
import type EnvJson from 'project/.env.json';
import type {
	Env,
	ServerSentEvent,
	JWTPayload,
	ToMultipart,
	WithJWT,
	ToOptional,
	RequestBodyFile,
	ToDownload,
	WebSocketMessage,
} from 'project/global';

import type { Stat, Data, User, Slide } from 'schemas/v0-alpha.1/admin';

import fs from 'fs-extra';
import path from 'path';
import faker from 'faker';
import bcrypt from 'bcrypt';
import sharp from 'sharp';
import chalk from 'chalk';
import { ansiToHtml } from 'anser';
// @ts-ignore
import ansi from 'ansi-html-stream';
import { on, EventEmitter } from 'events';
import Api from 'utility/api';
import { spawn, ChildProcess } from 'child_process';
import { Multipart, MultipartFields } from 'fastify-multipart';

const route: FastifyPluginAsync = async (server, opts) => {
	const {
		env: {
			PROJECT_ROOT_DIR,
			SERVER_PUBLIC_DIR,
			SERVER_STATIC_PATH,
			SERVER_LOGS_DIR,
		},
	} = process as Env<typeof EnvJson>;
	const api = 'admin';
	const version = 'v0-alpha.1';
	const { jwt, orm, rbac, totp, event, wss } = server;
	const model = [
		'buyer',
		'seller',
		'courier',
		'internal',
		'cart',
		'selected-item',
		'group-order',
		'delivery',
		'ordered-item',
		'order',
		'store',
		'product',
	];
	const modelEvent = new EventEmitter();
	const imagePath = path.join(SERVER_PUBLIC_DIR, 'images');
	const imageStatic = path.join(SERVER_STATIC_PATH, 'images');
	const dataPath = path.join(PROJECT_ROOT_DIR, 'data.json');
	const data: Data = await loadData();

	await fs.mkdir(imagePath, { recursive: true });

	let studio: ChildProcess | null = null;

	for (const table of model) {
		event.on(`model:${table}:change`, (args: any) => {
			modelEvent.emit('change', {
				tag: `model:${table}:change`,
				data: args,
			} as ServerSentEvent);
		});
	}

	server.route({
		url: `/${api}`,
		method: 'GET',
		handler: (request, reply) => {
			const event = reply.createEvent();
			modelEvent.on('change', listener);
			event.once('close', () => modelEvent.removeListener('change', listener));
			function listener(arg: any) {
				event.send('message', arg);
			}
		},
	});

	server.route<{}>({
		url: `/${api}/stat`,
		method: 'GET',
		handler: async (request, reply) => {
			const user = await request.identify('internal');
			const buyer = await orm.buyer.count();
			const seller = await orm.seller.count();
			const courier = await orm.courier.count();
			const order = await orm.order.count();
			const product = await orm.product.count();
			const orderCost = await orm.order.aggregate({
				_sum: {
					cost: true,
				},
				where: {
					status: { in: ['Done'] },
				},
			});
			const deliveryCost = await orm.delivery.aggregate({
				_sum: {
					cost: true,
				},
				where: {
					status: 'Done',
				},
			});
			let sales = '0';
			if (orderCost._sum.cost && deliveryCost._sum.cost) {
				sales = orderCost._sum.cost.add(deliveryCost._sum.cost) + '';
			}
			reply.ok<Stat>({
				user: buyer + seller + courier,
				order,
				product,
				sales,
			});
		},
		schema: {},
	});

	server.route<{}>({
		url: `/${api}/business`,
		method: 'GET',
		handler: async (request, reply) => {
			const user = await request.identify('internal');
			reply.ok(data.business);
		},
		schema: {},
	});

	server.route<{
		Body: Data['business'];
	}>({
		url: `/${api}/business`,
		method: 'PATCH',
		handler: async (request, reply) => {
			const user = await request.identify('internal');
			data.business = request.body;
			await saveData(data);
			reply.created(data.business);
			event.emit('data:changed', data);
		},
		schema: {},
	});

	server.route<{}>({
		url: `/${api}/model`,
		method: 'GET',
		handler: async (request, reply) => {
			const user = await request.identify('internal');
			reply.ok(data.model);
		},
		schema: {},
	});

	server.route<{
		Body: Data['model'];
	}>({
		url: `/${api}/model`,
		method: 'PATCH',
		handler: async (request, reply) => {
			const user = await request.identify('internal');
			const result = await orm.internal.findUnique({
				where: { id: user.sub },
			});
			if (!result) {
				throw Api.Error.FailedAuthentication('Unknown User');
			}
			if (request.body.open) {
				studio = startStudio();

				studio.on('spawn', async () => {
					console.log(studio);

					data.model.open = true;
					data.model.link = '/server/orm';
					data.model.openBy = result.username;
					data.model.openAt = new Date().toISOString();

					await saveData(data);

					reply.created(data.model);
					event.emit('data:changed', data);
				});
			} else {
				studio?.on('close', async () => {
					console.log(studio);

					data.model.open = false;
					data.model.link = '';
					data.model.openBy = '';
					data.model.openAt = '';

					await saveData(data);

					reply.created(data.model);
					event.emit('data:changed', data);

					studio = null;
				});
				studio?.kill();
			}
			return reply;
		},
		schema: {},
	});

	server.route<{}>({
		url: `/${api}/slide`,
		method: 'GET',
		handler: async (request, reply) => {
			const user = await request.identify('internal');
			reply.ok(data.slides);
		},
		schema: {},
	});
	server.route<{}>({
		url: `/${api}/slide`,
		method: 'PATCH',
		handler: async (request, reply) => {
			const user = await request.identify('internal');
			const files = request.files();
			const slides: Slide[] = [];

			await fs.emptyDir(imagePath);

			for await (const data of files) {
				const { link } = data.fields as MultipartFields & {
					link: Multipart<string>[];
				};
				const id = data.fieldname;
				const filename = path.join( id + path.extname(data.filename));
				slides.push({
					id: +id,
					src: path.join(imageStatic, filename),
					link: link[+id].value,
				});
				data.file.pipe(fs.createWriteStream(path.join(imagePath, filename)));
			}

			data.slides = slides as any;

			await saveData(data);

			reply.ok();
		},
		schema: {},
	});

	server.route<{
		Params: { role: string; id: string };
	}>({
		url: `/${api}/user/:role-:id`,
		method: 'GET',
		handler: async (request, reply) => {
			const user = await request.identify('internal');
			const users: User[] = [];
			const { role, id } = request.params;
			if (role == 'buyer') {
				const buyer = await orm.buyer.findFirst({
					where: { id: +id },
					include: { address: { take: 1, where: { selected: true } } },
					rejectOnNotFound: true,
				});
				users.push({
					id: buyer.id,
					node: buyer.chatNodeId,
					role: buyer.role,
					username: buyer.username,
					email: buyer.email,
					telp: buyer.telp,
					address: buyer.address[0]?.value,
					image: buyer.image,
				});
			} else if (role == 'seller') {
				const seller = await orm.seller.findFirst({
					where: { id: +id },
					include: { store: true },
					rejectOnNotFound: true,
				});
				users.push({
					id: seller.id,
					node: seller.store?.chatNodeId ?? 0,
					role: seller.role,
					username: seller.username,
					email: seller.email,
					telp: seller.store?.telp,
					address: seller.store?.address,
					image: seller.store?.image,
				});
			} else if (role == 'courier') {
				const courier = await orm.courier.findFirst({
					where: { id: +id },
					rejectOnNotFound: true,
				});
				users.push({
					id: courier.id,
					node: courier.chatNodeId,
					role: courier.role,
					username: courier.username,
					email: courier.email,
					telp: courier.telp,
					address: courier.address,
					image: courier.image,
				});
			}
			reply.ok(users[0]);
		},
		schema: {},
	});
	server.route({
		url: `/${api}/user`,
		method: 'GET',
		handler: async (request, reply) => {
			const user = await request.identify('internal');
			const buyers = await orm.buyer.findMany({
				include: { address: { take: 1, where: { selected: true } } },
			});
			const sellers = await orm.seller.findMany({ include: { store: true } });
			const couriers = await orm.courier.findMany();
			const users: User[] = [];

			for (const buyer of buyers) {
				users.push({
					id: buyer.id,
					node: buyer.chatNodeId,
					role: buyer.role,
					username: buyer.username,
					email: buyer.email,
					telp: buyer.telp,
					address: buyer.address[0]?.value,
					image: buyer.image,
				});
			}
			for (const seller of sellers) {
				users.push({
					id: seller.id,
					node: seller.store?.chatNodeId ?? 0,
					role: seller.role,
					username: seller.username,
					email: seller.email,
					telp: seller.store?.telp,
					address: seller.store?.address,
					image: seller.store?.image,
				});
			}
			for (const courier of couriers) {
				users.push({
					id: courier.id,
					node: courier.chatNodeId,
					role: courier.role,
					username: courier.username,
					email: courier.email,
					telp: courier.telp,
					address: courier.address,
					image: courier.image,
				});
			}
			reply.ok(users);
		},
		schema: {},
	});

	server.route<{
		Params: { id: string };
	}>({
		url: `/${api}/product/:id`,
		method: 'GET',
		handler: async (request, reply) => {
			const user = await request.identify('internal');
			const products = await orm.product.findFirst({
				where: { id: +request.params.id },
				include: { store: true },
				rejectOnNotFound: true,
			});
			reply.ok(products);
		},
		schema: {},
	});
	server.route<{}>({
		url: `/${api}/product`,
		method: 'GET',
		handler: async (request, reply) => {
			const user = await request.identify('internal');
			const products = await orm.product.findMany({ include: { store: true } });
			reply.ok(products);
		},
		schema: {},
	});

	server.route<{
		Params: { id: string };
	}>({
		url: `/${api}/order/:id`,
		method: 'GET',
		handler: async (request, reply) => {
			const user = await request.identify('internal');
			const order = await orm.order.findFirst({
				where: { id: +request.params.id },
				include: {
					item: { include: { product: true } },
					delivery: {
						include: {
							sender: true,
							recipient: { include: { buyer: true } },
							courier: true,
						},
					},
				},
				rejectOnNotFound: true,
			});
			reply.ok(order);
		},
		schema: {},
	});
	server.route<{}>({
		url: `/${api}/order`,
		method: 'GET',
		handler: async (request, reply) => {
			const user = await request.identify('internal');
			const orders = await orm.order.findMany({
				include: {
					item: { include: { product: true } },
					delivery: { include: { sender: true, recipient: true } },
				},
			});
			reply.ok(orders);
		},
		schema: {},
	});

	server.route<{
		Params: { id: string };
	}>({
		url: `/${api}/sales/:id`,
		method: 'GET',
		handler: async (request, reply) => {
			const user = await request.identify('internal');
			const sale = await orm.order.findFirst({
				where: { AND: [{ status: 'Done' }, { id: +request.params.id }] },
				include: {
					buyer: true,
					item: { include: { product: true } },
					delivery: {
						include: {
							sender: true,
							recipient: true,
							courier: true,
						},
					},
					rating: true,
				},
				rejectOnNotFound: true,
			});
			reply.ok(sale);
		},
		schema: {},
	});
	server.route<{}>({
		url: `/${api}/sales`,
		method: 'GET',
		handler: async (request, reply) => {
			const user = await request.identify('internal');
			const sales = await orm.order.findMany({
				where: { status: 'Done' },
				include: {
					store: true,
					item: { include: { product: true } },
					delivery: true,
					rating: { include: { buyer: true } },
				},
			});
			reply.ok(sales);
		},
		schema: {},
	});

	server.route<{}>({
		url: `/${api}/log`,
		method: 'GET',
		handler: async (request, reply) => {
			const user = await request.identify('internal');
			const dir = path.join(SERVER_LOGS_DIR, 'server.log');
			const event = reply.createEvent();
			const buffer = await fs.readFile(dir);

			fs.watchFile(dir, listener);

			event
				.once('close', () => {
					fs.unwatchFile(dir, listener);
				})
				.send('data', {
					tag: 'initial',
					data: ansiToHtml(buffer.toString()),
				});

			return reply;

			function listener(curr: fs.Stats, prev: fs.Stats) {
				let text = '';

				fs.createReadStream(dir, { start: prev.size })
					.on('data', (chunk) => (text += chunk))
					.once('close', () => {
						event.send('data', { tag: 'continue', data: ansiToHtml(text) });
					});
			}
		},
		schema: {},
	});

	server.route<{}>({
		url: `/${api}/log`,
		method: 'DELETE',
		handler: async (request, reply) => {
			const user = await request.identify('internal');
			const dir = path.join(SERVER_LOGS_DIR, 'server.log');
			await fs.writeFile(dir, '');
			reply.ok(true);
		},
		schema: {},
	});

	function saveData(data: Data) {
		return fs.writeFile(dataPath, JSON.stringify(data, null, '\t'));
	}
	async function loadData() {
		const buf = await fs.readFile(dataPath);
		return JSON.parse(buf.toString());
	}
	function startStudio() {
		return spawn('npm run db:preview', [], {
			cwd: PROJECT_ROOT_DIR,
			shell: true,
			stdio: 'inherit',
			detached: true,
			timeout: 60 * 5,
		});
	}
};

export default route;
