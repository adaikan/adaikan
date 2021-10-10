/// <reference types="./src/global" />

import preprocess from 'svelte-preprocess';
import adapter_static from '@sveltejs/adapter-static';
import liveReload from 'vite-plugin-live-reload';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import url from 'url';

dotenv.config({ debug: true });

/**
 * @type {{env: ImportMetaEnv}}
 */
const { env } = process;
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
/**
 * @type {import('vite').UserConfig}
 */
const vite = {
	server: {
		proxy: {
			[env.VITE_SERVER_BASE_API_PATH]: {
				target: env.VITE_SERVER_ORIGIN,
				changeOrigin: true,
				rewrite: (path) => path
			},
			[env.VITE_SERVER_STATIC_PATH]: {
				target: env.VITE_SERVER_ORIGIN,
				changeOrigin: true,
				rewrite: (path) => path
			},
			[env.VITE_WS_SERVER_BASE_PATH]: {
				target: env.VITE_WS_SERVER_ORIGIN,
				ws: true,
				changeOrigin: true,
				rewrite: (path) => path
			}
		}
	},
	resolve: {
		alias: {
			$static: path.resolve(__dirname, 'static'),
			$components: path.resolve(__dirname, 'src/components'),
			$apis: path.resolve(__dirname, 'src/apis'),
			$features: path.resolve(__dirname, 'src/features'),
			$server: path.resolve(__dirname, '../../')
		}
	},
	plugins: [liveReload.default(['src/routes/**'])]
};
/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [preprocess()],
	kit: {
		vite,
		paths: {
			base: '/admin'
		},
		target: 'body',
		adapter: adapter_static({
			pages: 'build',
			assets: 'build',
			fallback: null
		})
	}
};

export default config;
