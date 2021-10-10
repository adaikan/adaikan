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
	WSData,
} from 'project/global';

import type { Stat, Data } from 'schemas/v0-alpha.1/admin';

import fs from 'fs-extra';
import path from 'path';
import faker from 'faker';
import bcrypt from 'bcrypt';
import sharp from 'sharp';
import { on, EventEmitter } from 'events';
import Api from 'utility/api';
import { spawn, exec, ChildProcess } from 'child_process';

const route: FastifyPluginAsync = async (server, opts) => {
	const {
		env: { PROJECT_ROOT_DIR, SERVER_PUBLIC_DIR, SERVER_STATIC_PATH },
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
				message: args,
			} as ServerSentEvent);
		});
	}

	server.route({
		url: `/${api}`,
		method: 'GET',
		handler: (request, reply) => {
			reply.sse(
				(async function* () {
					for await (const events of on(
						modelEvent,
						'change'
					) as AsyncIterableIterator<ServerSentEvent[]>) {
						for (const event of events) {
							yield {
								type: 'message',
								data: JSON.stringify(event),
							};
						}
					}
				})()
			);
		},
	});

	server.route<{}>({
		url: `/${api}/stat`,
		method: 'GET',
		handler: async (request, reply) => {
			const user = await request.identify();
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
			const user = await request.identify();
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
			const user = await request.identify();
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
			const user = await request.identify();
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
			const user = await request.identify();
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
			const user = await request.identify();
			reply.ok(data.slides);
		},
		schema: {},
	});
	server.route<{}>({
		url: `/${api}/slide`,
		method: 'PATCH',
		handler: async (request, reply) => {
			const user = await request.identify();
			const files = request.files();
			const slides: string[] = [];

			await fs.emptyDir(imagePath);

			for await (const data of files) {
				slides.push(path.join(imageStatic, data.filename));
				data.file.pipe(
					fs.createWriteStream(path.join(imagePath, data.filename))
				);
			}

			data.slides = slides as any;

			await saveData(data);

			reply.ok();
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
