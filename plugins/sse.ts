import type {} from 'events';
import type {
	FastifyInstance,
	FastifyPluginAsync,
	FastifyReply,
	FastifyRequest,
} from 'fastify';
import wrapper from 'fastify-plugin';
import chalk from 'chalk';
import { EventEmitter } from 'events';

declare module 'fastify' {
	interface FastifyInstance {
		sse: SSE;
	}
	interface FastifyReply {
		createEvent(): SSEReply;
	}
}

interface Options {
	prefix?: string;
}
interface Plugin extends FastifyPluginAsync<Options> {}

class SSE {
	static connections = new Set<SSEReply>();
	public prefix;
	constructor(private app: FastifyInstance, options?: { prefix?: string }) {
		this.prefix = options?.prefix ?? '';
	}
	route(route: {
		path: string;
		handler: (
			this: FastifyInstance,
			request: FastifyRequest,
			reply: SSEReply
		) => void;
	}) {
		this.app.route({
			url: this.prefix + route.path,
			method: 'GET',
			handler: (request, reply) => {
				const sse_reply = new SSEReply(reply);
				route.handler.call(this.app, request, sse_reply);
			},
		});
	}
}

class SSEReply extends EventEmitter {
	constructor(private reply: FastifyReply) {
		super();

		reply.raw.setHeader('Content-Type', 'text/event-stream');
		reply.raw.setHeader('Connection', 'keep-alive');
		reply.raw.setHeader('Cache-Control', 'no-cache');
		reply.raw.write('\n');

		SSE.connections.add(this);

		reply.log.info(
			chalk`Server Sent Event Connection {yellow ${reply.request.method}:} {white ${reply.request.url}} {blue (${SSE.connections.size})} {magenta ${reply.request.ip}}`
		);

		reply.raw.on('error', (error) => {
			this.emit('error', error);
		});
		reply.raw.once('close', () => {
			SSE.connections.delete(this);
			reply.log.info(
				chalk`Server Sent Event Disconnection {yellow ${reply.request.method}:} {green ${reply.statusCode} -} {white ${reply.request.url}} {blue (${SSE.connections.size})} {magenta ${reply.request.ip}}`
			);
			this.emit('close');
			this.clean();
		});
	}
	public send(
		type: string | { id: number; type: string; retry?: number },
		...chunk: any[]
	) {
		if (typeof type == 'object') {
			this.reply.raw.write(serialize(type));
		} else {
			this.reply.raw.write(serialize({ type }));
		}
		if (chunk.length == 1) {
			chunk = chunk[0];
		}
		this.reply.raw.write(serialize({ data: chunk }));
		this.reply.raw.write('\n');
		return this;
	}
	public close(chunk: any) {
		this.reply.raw.end(serialize({ end: chunk }));
		return this;
	}
	public clean() {
		setTimeout(() => {
			this.reply.raw.removeAllListeners();
			this.removeAllListeners();
		});
		return this;
	}
}

const name = 'sse';
const plugin: Plugin = async (server, opts) => {
	server.decorate(name, new SSE(server, { prefix: opts.prefix }));
	server.decorateReply('createEvent', function (this: FastifyReply) {
		const reply = new SSEReply(this);
		return reply;
	});
	server.addHook('onClose', () => {
		for (const connection of SSE.connections) {
			connection.close('');
		}
		SSE.connections.clear();
	});
};

function serialize(chunk: object): string {
	let result = '';
	for (let [key, value] of Object.entries(chunk)) {
		if (typeof value == 'object') {
			value = JSON.stringify(value);
		}
		result += `${key}: ${value}\n`;
	}
	if (!result) {
		return '';
	}
	return result;
}

declare const sse: Plugin;
export default wrapper(plugin, { name });
