import type { FastifyPluginAsync } from 'fastify';
import type { JWTPayload, UserInfo } from './../global';

import wrapper from 'fastify-plugin';
import Api from '../utility/api';

declare module 'fastify' {
	interface FastifyRequest {
		/**
		 * Identify User
		 *
		 * must provide Bearer Token
		 */
		identify(): Promise<UserInfo>;
	}
}

interface Options {}
interface Plugin extends FastifyPluginAsync<Options> {}

const name = 'identify';
const plugin: Plugin = async (server, opts) => {
	const { jwt, rbac } = server;

	server.decorateRequest<() => Promise<UserInfo>>(name, async function () {
		try {
			const payload = await jwt.verify<JWTPayload>(
				this.headers.authorization as string
			);
			if (payload) {
				const { role, sub } = payload;
				let username = 'system';
				switch (role) {
					case 'buyer':
						break;
					case 'seller':
						break;
					case 'courier':
						break;
					case 'internal':
						break;

					default:
						throw Api.Error.FailedAuthentication('Invalid Role');
				}
				return {
					sub,
					role,
					username,
					entity: `${role}::${username}`,
					time: new Date(),
				};
			} else {
				throw Api.Error.FailedAuthentication('Unknown User');
			}
		} catch (error: any) {
			return {
				sub: 0,
				role: 'system',
				time: new Date(),
				username: 'automatic',
				entity: `system::automatic`,
			};
		}
	});
};

declare const orm: Plugin;
export default wrapper(plugin, { name });
