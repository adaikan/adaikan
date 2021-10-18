import type {} from 'events';
import type { FastifyPluginAsync, FastifyReply } from 'fastify';
import wrapper from 'fastify-plugin';
import chalk from 'chalk';
import { EventEmitter } from 'events';

declare module 'fastify' {
	interface FastifyReply {
		createEvent(): SSE;
	}
}

interface Options {}
interface Plugin extends FastifyPluginAsync<Options> {}

class SSE extends EventEmitter {
	static connections = new Set<SSE>();
	constructor(private reply: FastifyReply) {
		super();

		SSE.connections.add(this);

		reply.raw.setHeader('Content-Type', 'text/event-stream');
		reply.raw.setHeader('Connection', 'keep-alive');
		reply.raw.setHeader('Cache-Control', 'no-cache');
		reply.raw.write('\n');

		reply.log.info(
			chalk`{white Server Sent Event Connection} {yellow ${reply.request.method}:} {white ${reply.request.url}} {blue (${SSE.connections.size})}`
		);

		reply.raw.on('error', (error) => {
			this.emit('error', error);
		});
		reply.raw.once('close', () => {
			SSE.connections.delete(this);
			reply.log.info(
				chalk`{white Server Sent Event Disconnection} {yellow ${reply.request.method}:} {green ${reply.statusCode} -} {white ${reply.request.url}} {blue (${SSE.connections.size})}`
			);
			this.emit('close');
			this.clear();
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
	public clear() {
		setTimeout(() => {
			this.reply.raw.removeAllListeners();
			this.removeAllListeners();
		});
		return this;
	}
}

const name = 'sse';
const plugin: Plugin = async (server, opts) => {
	server.decorateReply('createEvent', function (this: FastifyReply) {
		return new SSE(this);
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
