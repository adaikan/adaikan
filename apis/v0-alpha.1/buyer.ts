import type { FastifyPluginAsync } from 'fastify';
import type EnvJson from 'project/.env.json';
import type {
	Env,
	JWTPayload,
	ToMultipart,
	WithJWT,
	ToOptional,
	RequestBodyFile,
	ToDownload,
} from 'project/global';

import type {
	Data,
	DataHistory,
	GetQuery,
	SearchQuery,
	CreateQuery,
	UpdateQuery,
	UpsertQuery,
	DeleteQuery,
	AggregateQuery,
	GroupQuery,
	BatchQuery,
	SearchManyQuery,
	CreateManyQuery,
	UpdateManyQuery,
	DeleteManyQuery,
	ValidateQuery,
	QueringGet,
	QueringSearch,
	QueringCreate,
	QueringUpdate,
	QueringUpsert,
	QueringDelete,
	QueringAggregate,
	QueringGroup,
	QueringBatch,
	QueringSearchMany,
	QueringCreateMany,
	QueringUpdateMany,
	QueringDeleteMany,
	LoginData,
	RegisterData,
	UnregisterData,
	ChangePasswordData,
	Verify,
	ResetPasswordData,
} from 'schemas/v0-alpha.1/buyer';

import fs from 'fs-extra';
import path from 'path';
import bcrypt from 'bcrypt';
import sharp from 'sharp';
import Api from 'utility/api';

import { BuyerModel } from 'models/buyer';
import { FileStorage } from 'utility/storage';

const route: FastifyPluginAsync = async (server, opts) => {
	const {
		env: { SERVER_PUBLIC_DIR, SERVER_STATIC_PATH },
	} = process as Env<typeof EnvJson>;
	const api = 'buyer';
	const role = 'buyer';
	const salt = bcrypt.genSaltSync(16);
	const { jwt, orm, rbac, totp, mail } = server;
	const FILE_DIR = path.join(SERVER_PUBLIC_DIR, api);
	const IMAGE_DIR = FileStorage.path.join(FILE_DIR, 'image');
	const IMAGE_STATIC = FileStorage.path.join(SERVER_STATIC_PATH, api, 'image');
	const image = new FileStorage({ root: IMAGE_DIR });
	const model = new BuyerModel(orm);

	await image.init();

	server.route<{
		Body: RegisterData;
	}>({
		url: `/${api}/register`,
		method: 'POST',
		handler: async (request, reply) => {
			const user = await request.identify();
			const data = await model.setInfo(user).create({
				data: {
					role,
					username: request.body.username,
					password: await bcrypt.hash(request.body.password, salt),
					email: request.body.email,
					chatNode: { create: { role, name: request.body.username } },
				},
			});
			const otp = totp.generate(data.password);
			const token = await jwt.sign<JWTPayload>({
				sub: data.id,
				role,
			});

			reply.header('authorization', `Bearer ${token}`);
			reply.created<Data>(data);
			server.event.emit(`model:${api}:change`, data);

			await mail.send({
				from: `no-reply@` + request.headers.host,
				to: data.email,
				subject: 'Your OTP Code',
				priority: 'high',
				replyTo: `no-reply@` + request.headers.host,
				html: otpTemplate(otp),
			});
		},
		schema: {},
	});

	server.route<{
		Body: LoginData;
	}>({
		url: `/${api}/unregister`,
		method: 'DELETE',
		handler: async (request, reply) => {
			const user = await request.identify();
			const data = await model.get({
				where: { username: request.body.username },
			});
			if (data) {
				const same = bcrypt.compareSync(request.body.password, data.password);
				if (same) {
					await model.delete({ where: { username: data.username } });
					await fs.rm(path.join(FILE_DIR, data.id + ''), {
						recursive: true,
					});
					reply.ok<Data>(data);
					server.event.emit(`model:${api}:change`, data);
				} else {
					throw Api.Error.FailedUnregister('Invalid Password');
				}
			} else {
				throw Api.Error.FailedUnregister('Invalid Username');
			}
		},
		schema: {},
	});

	server.route<{
		Body: LoginData;
	}>({
		url: `/${api}/login`,
		method: 'POST',
		handler: async (request, reply) => {
			const data = await model.get({
				where: { username: request.body.username },
			});
			if (data) {
				const same = bcrypt.compareSync(request.body.password, data.password);
				if (same) {
					const token = await jwt.sign<JWTPayload>({
						sub: data.id,
						role,
					});
					reply.header('authorization', `Bearer ${token}`);
					reply.ok<Data>(data);
				} else {
					throw Api.Error.FailedLogin('Invalid Password');
				}
			} else {
				throw Api.Error.FailedLogin('Invalid Username');
			}
		},
		schema: {},
	});

	server.route<{ Body: ChangePasswordData }>({
		url: `/${api}/password`,
		method: 'PATCH',
		handler: async (request, reply) => {
			const user = await request.identify();
			const data = await model.get({
				where: { username: request.body.username },
			});

			if (data) {
				if (data.role == role) {
					const same = await bcrypt.compare(
						request.body.password,
						data.password
					);
					if (same) {
						if (request.body.newPassword == request.body.password) {
							throw Api.Error.InvalidArgument(
								'Gagal password lama dan baru sama',
								{ newPassword: request.body.newPassword }
							);
						}
						if (request.body.newPassword != request.body.confirmPassword) {
							throw Api.Error.InvalidArgument('Gagal password tidak sama', {
								confirmPassword: request.body.confirmPassword,
							});
						}
						const result = await model.setInfo(user).update({
							where: { id: data.id },
							data: {
								password: await bcrypt.hash(request.body.confirmPassword, salt),
							},
						});
						reply.ok<Data>(result);
						server.event.emit(`model:${api}:change`, data);
					} else {
						throw Api.Error.InvalidArgument('Gagal password salah', {
							password: request.body.password,
						});
					}
				} else {
					throw Api.Error.FailedAuthentication('Invalid Role');
				}
			} else {
				throw Api.Error.FailedAuthentication('Unknown User');
			}
		},
		schema: {},
	});

	server.route<{ Body: ResetPasswordData }>({
		url: `/${api}/password-reset`,
		method: 'PATCH',
		handler: async (request, reply) => {
			const user = await request.identify();
			const data = await model.search({
				where: {
					AND: [
						{ username: request.body.username },
						{ email: request.body.email },
					],
				},
			});

			if (data) {
				const result = await model.setInfo(user).update({
					where: { id: data.id },
					data: {
						password: await bcrypt.hash(request.body.new_password, salt),
					},
				});
				reply.ok<Data>(result);
				server.event.emit(`model:${api}:change`, data);
			} else {
				throw Api.Error.FailedAuthentication('Unknown User');
			}
		},
		schema: {},
	});

	server.route({
		url: `/${api}/auth`,
		method: 'GET',
		handler: async (request, reply) => {
			const user = await request.identify();
			const data = await model.search({
				where: { AND: [{ id: user.sub }, { verified: true }] },
			});

			if (data) {
				if (data.role == role) {
					reply.ok<Data>(data);
				} else {
					throw Api.Error.FailedAuthentication('Invalid Role');
				}
			} else {
				throw Api.Error.FailedAuthentication('Unknown User');
			}
		},
		schema: {},
	});

	server.route<{
		Body: string;
	}>({
		url: `/${api}/generate`,
		method: 'POST',
		handler: async (request, reply) => {
			const data = await model.get({
				where: { email: request.body },
			});
			if (data) {
				if (data.verified) {
					throw Api.Error.FailedVerifyOtp('Otp has been verified');
				} else {
					const otp = totp.generate(data.password);

					await mail.send({
						from: `no-reply@` + request.headers.host,
						to: data.email,
						subject: 'Your OTP Code',
						priority: 'high',
						replyTo: `no-reply@` + request.headers.host,
						html: otpTemplate(otp),
					});
					reply.ok(true);
				}
			} else {
				throw Api.Error.FailedAuthentication('Unknown User');
			}
		},
		schema: {},
	});

	server.route<{
		Body: Verify;
	}>({
		url: `/${api}/verify`,
		method: 'POST',
		handler: async (request, reply) => {
			const user = await request.identify();
			const result = await model.get({ where: { email: request.body.email } });

			if (result) {
				const valid = totp.verify(request.body.otp, result.password);
				if (valid) {
					model.setInfo(user).update({
						where: { id: result.id },
						data: { verified: true },
					});
					reply.ok(true);
				} else {
					throw Api.Error.FailedVerifyOtp('Invalid Otp');
				}
			} else {
				throw Api.Error.FailedAuthentication('Unknown User');
			}
		},
		schema: {},
	});

	server.route<{
		Body: Verify;
	}>({
		url: `/${api}/verify-reset`,
		method: 'POST',
		handler: async (request, reply) => {
			const user = await request.identify();
			const result = await model.get({ where: { email: request.body.email } });

			if (result) {
				const valid = totp.verify(request.body.otp, result.password);
				if (valid) {
					reply.ok(result);
				} else {
					throw Api.Error.FailedVerifyOtp('Invalid Otp');
				}
			} else {
				throw Api.Error.FailedAuthentication('Unknown User');
			}
		},
		schema: {},
	});

	server.route<{
		Body: SearchQuery;
	}>({
		url: `/${api}/search`,
		method: 'POST',
		handler: async (request, reply) => {
			const user = await request.identify();
			const data = await model.search(request.body);
			reply.ok(data);
		},
		schema: {},
	});

	server.route<{
		Body: UpdateQuery;
	}>({
		url: `/${api}/update`,
		method: 'PATCH',
		handler: async (request, reply) => {
			const user = await request.identify();
			delete request.body.data.password;
			request.body.data.chatNode = {
				update: {
					name: request.body.data.name as any,
					image: request.body.data.image as any,
				},
			};
			const data = await model.setInfo(user).update(request.body);
			reply.ok(data);
			server.event.emit(`model:${api}:change`, data);
		},
		schema: {},
	});

	server.route<{
		Body: AggregateQuery;
	}>({
		url: `/${api}/aggrerate`,
		method: 'POST',
		handler: async (request, reply) => {
			const user = await request.identify();
			const data = await model.aggrerate(request.body);
			reply.ok(data);
		},
		schema: {},
	});

	server.route<{
		Body: GroupQuery;
	}>({
		url: `/${api}/group`,
		method: 'POST',
		handler: async (request, reply) => {
			const user = await request.identify();
			const data = await model.group(request.body);
			reply.ok(data);
		},
		schema: {},
	});

	server.route<{
		Body: BatchQuery[];
	}>({
		url: `/${api}/batch`,
		method: 'POST',
		handler: async (request, reply) => {
			const user = await request.identify();
			const result = await model.setInfo(user).batch(request.body);
			model.unsetInfo();
			reply.ok(result);
		},
		schema: {},
	});

	server.route<{
		Body: SearchManyQuery;
	}>({
		url: `/${api}/searchMany`,
		method: 'POST',
		handler: async (request, reply) => {
			const user = await request.identify();
			const data = await model.searchMany(request.body);
			reply.ok(data);
		},
		schema: {},
	});

	server.route<{
		Body: UpdateManyQuery;
	}>({
		url: `/${api}/updateMany`,
		method: 'PATCH',
		handler: async (request, reply) => {
			const user = await request.identify();
			const data = await model.updateMany(request.body);
			reply.ok(data);
		},
		schema: {},
	});

	server.route<{
		Params: { '*': string };
	}>({
		url: `/${api}/image/*`,
		method: 'POST',
		handler: async (request, reply) => {
			const user = await request.identify();
			const dirname = FileStorage.path.dirname(request.params['*']);
			const filename = FileStorage.path.basename(request.params['*']);
			const src = FileStorage.path.join(IMAGE_STATIC, request.params['*']);

			await image.saveImage(request.raw, { dirname, filename });

			reply.type('text/plain');
			reply.code(201);
			reply.send(src);

			return reply;
		},
		schema: {},
	});

	server.route<{
		Params: { '*': string };
	}>({
		url: `/${api}/image/*`,
		method: 'GET',
		handler: async (request, reply) => {
			reply.notImplemented();
		},
		schema: {},
	});
};

export default route;

function otpTemplate(code: string) {
	return `
		<!DOCTYPE html>
		<html lang="en">
			<head>
				<meta charset="utf-8" />
				<meta name="author" content="Arwana Dev Team" />
				<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
				<meta name="theme-color" content="#42A5F5" />
				<meta name="theme-color" media="(prefers-color-scheme: light)" content="white" />
				<meta name="theme-color" media="(prefers-color-scheme: dark)" content="black" />
				<title>Your Code OTP</title>
			</head>
			<body style="max-width: 100vw; min-height: 100vh; padding: 32px; display: grid; align-content: start; gap: 4px;">
				<h1 style="padding: 0;">Dear Registerant</h1>
				<h2 style="padding: 0;">Thank you for registering with AdaIkan</h2>
				<p style="font-size: 16px;">To continue, please verify your E-mail address.</p>
				<p style="font-size: 16px;">Attention, do not give OTP code to anyone, your OTP code: <strong>${code}</strong>, is valid for up to 60 seconds from the start of your registration and do not refresh or close your verification page.</p>
				<h3 style="padding: 0;">Warm Regards</h3>
				<h3 style="padding: 0;"><em>AdaIkan</em></h3>
			</body>
		</html>
	`;
}
