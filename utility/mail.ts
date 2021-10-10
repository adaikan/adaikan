import type { Env } from 'global';
import type EnvType from '../.env.json';

import type { FastifyInstance } from 'fastify';

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { SMTPServer } from 'smtp-server';
import { createTransport, Transporter } from 'nodemailer';

export interface Options extends ListenOptions {
	verbose?: boolean;
	app: FastifyInstance;
	url: string;
}
export interface ListenOptions {
	port?: number;
	host?: string;
}
export interface SendOptions {
	from: string | { name: string; address: string };
	to: string | { name: string; address: string } | (string | { name: string; address: string })[];
	replyTo?: string | { name: string; address: string };
	priority?: 'high' | 'low' | 'normal';
	html: string;
	test?: string;
}

export const defOpts: Options = {
	verbose: true,
	url: '',
	app: null as any,
	host: '0.0.0.0',
	port: 25,
};

export class Mail {
	public static server: SMTPServer;
	public static client: Transporter;
	public static url = 'smtp://username:password@smtp.example.com/?pool=true';
	public static setup(opts: Options) {
		const { verbose, url, app } = Object.assign(
			{},
			defOpts,
			opts
		) as Required<Options>;
		if (!app) {
			throw new Error('App on options not exist');
		}
		this.url = `${url}/?pool=true`;
		this.client = createTransport(this.url, {
			logger: true,
		});

		console.log(chalk.bgBlack.white`Mail Server Created`, chalk.green`[*]`);
	}
	public static async send(options: SendOptions) {
		const message = await this.client.sendMail(options);
		return message;
	}
	public static load(opts: Options) {}
}
