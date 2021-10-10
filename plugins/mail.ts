import type { FastifyPluginAsync } from 'fastify';
import wrapper from 'fastify-plugin';

import { Mail, Options as MailOptions, ListenOptions, SendOptions } from 'utility/mail';

declare module 'fastify' {
	interface FastifyInstance {
		mail: {
			send(options: SendOptions): Promise<any>;
			listen(options: ListenOptions): void;
		};
	}
}

interface Options extends Omit<MailOptions, 'app'> {}
interface Plugin extends FastifyPluginAsync<Options> {}

const name = 'mail';
const plugin: Plugin = async (server, opts) => {
	server.decorate(name, {
		listen(options: ListenOptions) {
			Mail.setup({
				app: server,
				...opts,
				...options,
			});
		},
		send(options: SendOptions) {
			return Mail.send(options);
		},
	});
};

declare const mail: Plugin;
export default wrapper(plugin, { name });
