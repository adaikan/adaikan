import type { Env } from 'project/global';

import 'reflect-metadata';
import path from 'path';
import Dotenv from 'dotenv';
import chalk from 'chalk';
import Fastify from 'fastify';

import EnvJson from 'project/.env.json';
import { KeyPair } from 'utility/key-pair';

export interface Options {
	verbose: boolean;
	log: boolean;
	prefix: string;
}

export const defaultOptions: Options = {
	verbose: false,
	log: true,
	prefix: '',
};

Dotenv.config();

const { env } = process as Env<typeof EnvJson>;

export default class App {
	public options;
	public app;
	constructor(options?: Partial<Options>) {
		this.options = Object.assign({}, defaultOptions, options);

		console.log(chalk.bgBlack.white`Server Options`, { log: options?.log });

		this.app = Fastify({
			logger: this.options.log
				? { prettyPrint: { colorize: true } }
				: {
						prettyPrint: { colorize: true },
						file: path.join(env.SERVER_LOGS_DIR, 'server.log'),
				  },
		});
	}
	public async main() {
		await this.preSetup();
		await this.setup();
		await this.postSetup();
	}
	public async preSetup() {
		console.log(chalk.bgBlack.white`Pre Setup Server`, chalk.blue`[*]`);
		console.log(chalk.bgBlack.white`Pre Setup Server`, chalk.green`[*]`);
	}
	public async postSetup() {
		console.log(chalk.bgBlack.white`Post Setup Server`, chalk.blue`[*]`);
		await this.app.after();
		await this.app.ready();
		console.log(chalk.bgBlack.white`Post Setup Server`, chalk.green`[*]`);
	}
	public async setup() {
		try {
			console.log(chalk.bgBlack.white`Setup Server`, chalk.blue`[*]`);

			await this.app.register(import('fastify-cors'), {
				origin: env.SERVER_ALLOWED_ORIGINS
					? env.SERVER_ALLOWED_ORIGINS.split(',')
					: [],
				credentials: true,
			});
			await this.app.register(import('fastify-metrics'), {
				endpoint: '/server/metrics',
			});
			await this.app.register(import('fastify-swagger'), {
				routePrefix: '/server/docs',
				swagger: {
					swagger: '2.0',
					host:
						env.SERVER_ENV == 'production'
							? env.SERVER_DOMAIN
							: env.SERVER_HOST,
					info: {
						title: 'Ada Ikan API Documentations',
						description: '',
						version: '0.1.0',
						contact: {
							name: 'Anas Mubarak Yasin',
							email: 'bladerlaiga.97@gmail.com',
						},
					},
					tags: [],
				},
				exposeRoute: true,
			});
			await this.app.register(import('fastify-multipart'), {
				limits: { fileSize: 10_000_000 },
			});
			await this.app.register(import('fastify-static'), {
				root: env.SERVER_PUBLIC_DIR,
				prefix: env.SERVER_STATIC_PATH,
			});
			await this.app.register(import('project/plugins/validator'), {
				debug: env.SERVER_ENV == 'development',
			});
			await this.app.register(import('project/plugins/rbac'), {
				roles: {},
			});
			await this.app.register(import('project/plugins/orm'));
			await this.app.register(import('project/plugins/success'));
			await this.app.register(import('project/plugins/image'));
			await this.app.register(import('project/plugins/totp'), {
				pass: env.SECRET_KEY,
			});
			await this.app.register(import('project/plugins/jwt'), {
				...KeyPair.load({ verbose: this.options.verbose }),
				pass: env.SECRET_KEY,
			});
			await this.app.register(import('project/plugins/identify'));
			await this.app.register(import('plugins/event'));
			await this.app.register(import('plugins/sse'), {
				prefix: env.EVENT_SERVER_BASE_PATH,
			});
			await this.app.register(import('plugins/mail'), {
				url: env.EMAIL_URL,
			});
			await this.app.register(import('plugins/wss'), {
				prefix: env.WS_SERVER_BASE_PATH,
				ping: 50000,
			});
			await this.app.register(import('project/plugins/info'));
			await this.app.register(import('fastify-autoload'), {
				dir:
					env.SERVER_ENV == 'development'
						? path.join(env.PROJECT_ROOT_DIR, 'apis')
						: path.join(env.SERVER_BUILD_DIR, 'apis'),
				options: { prefix: env.API_SERVER_BASE_PATH },
			});

			console.log(chalk.bgBlack.white`Setup Server`, chalk.green`[*]`);
		} catch (error: any) {
			console.log(chalk.bgBlack.white`Setup Server`, chalk.red`[*]`);

			this.app.log.error(error);

			process.exit(1);
		}
	}
	public async up() {
		try {
			this.app.mail.listen({});
			this.app.wss.listen({ server: this.app.server });

			const address = await this.app.listen(
				env.SERVER_PORT,
				env.SERVER_HOSTNAME
			);

			console.log(
				chalk.bgBlack.white`Server Up listening on`,
				chalk.blue`${address}`,
				chalk.green`[*]`
			);
		} catch (error: any) {
			console.log(chalk.bgBlack.white`Server Up Failed`, chalk.red`[*]`);

			console.error(error);

			process.exit(1);
		}
	}
	public async down() {
		try {
			await this.app.close();

			console.log(chalk.bgBlack.white`Server Down`, chalk.green`[*]`);
		} catch (error: any) {
			console.log(chalk.bgBlack.white`Server Down Failed`, chalk.red`[*]`);

			console.error(error);

			process.exit(1);
		}
	}
}
