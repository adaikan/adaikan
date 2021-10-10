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
	Channel,
	ConnectContact,
	CreateContact,
	GetChannel,
	Message,
	SendMessage,
	ChatNode,
	ChatChannel,
	ChatMessage,
} from 'schemas/v0-alpha.1/chat';

import Api from 'utility/api';

import Chat, { ChatReceiveFormat, ChatSendFormat } from 'features/chat';
import { ChatMessageModel } from 'models/chat-message';
import { FileStorage } from 'utility/storage';
import EventEmitter from 'events';

const route: FastifyPluginAsync = async (server, opts) => {
	const {
		env: { SERVER_PUBLIC_DIR, SERVER_STATIC_PATH },
	} = process as Env<typeof EnvJson>;
	const api = 'chat';
	const version = 'v0-alpha.1';
	const { jwt, orm, rbac, totp, wss } = server;
	const IMAGE_DIR = FileStorage.path.join(SERVER_PUBLIC_DIR, api, 'image');
	const IMAGE_STATIC = FileStorage.path.join(SERVER_STATIC_PATH, api, 'image');
	const image = new FileStorage({ root: IMAGE_DIR });
	const chat = new Chat(orm);
	const modelMessage = new ChatMessageModel(orm);
	const channels = wss.getChannels();
	const address = wss.createAddress();

	await image.init();

	chat.event.on('message', (message: ChatMessage.Data) => {
		const data = JSON.stringify({
			tag: 'message',
			data: message,
			status: 'success',
		} as ChatReceiveFormat);
		channels.broadcast({ key: message.channelId + '', data });
	});
	chat.event.on(
		'join',
		(data: { from: number; to: number; channel: Channel[] }) => {
			const channel = data.channel[0];
			const message = JSON.stringify({
				tag: 'join',
				data: channel,
				status: 'success',
			} as ChatReceiveFormat);
			if (channel.type == 'PerToGroup') {
				channels.broadcast({ key: channel.id + '', data: message });
			} else {
				address.broadcast({ address: data.to + '', data: message });
			}
		}
	);

	wss.route({
		path: `/${version}/${api}`,
		handler: async (ws, channels) => {
			ws.on('message', async (data, binary) => {
				const message: ChatSendFormat<{ id: number; channel: Channel[] }> =
					JSON.parse(data.toString());
				if (message.tag == 'connect') {
					const { data } = message;
					address.set(data.id + '', ws);
					for (const channel of data.channel) {
						channels.addClientToChannel(channel.id + '', ws);
					}
				}
			});
		},
	});

	server.route<{
		Body: GetChannel;
	}>({
		url: `/${api}/channel`,
		method: 'POST',
		handler: async (request, reply) => {
			const result = await chat.getChannel(request.body);
			reply.ok<Channel[]>(result);
		},
		schema: {},
	});

	server.route<{
		Body: CreateContact;
	}>({
		url: `/${api}/create`,
		method: 'POST',
		handler: async (request, reply) => {
			// const result = await chat.createContact(request.body);
			// reply.ok(result);
			reply.notImplemented();
		},
		schema: {},
	});

	server.route<{
		Body: ConnectContact;
	}>({
		url: `/${api}/connect`,
		method: 'POST',
		handler: async (request, reply) => {
			const result = await chat.connectContact(request.body);
			reply.ok(result);
		},
		schema: {},
	});

	server.route<{
		Body: ChatMessage.CreateQuery;
	}>({
		url: `/${api}/message`,
		method: 'POST',
		handler: async (request, reply) => {
			const data = await modelMessage.create({
				data: request.body.data,
				include: { sentBy: true, replyFor: true },
			});
			reply.accept({});
			chat.event.emit('message', data);
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
