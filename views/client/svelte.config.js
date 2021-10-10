/// <reference types="./src/global" />

import { readFileSync } from 'fs';
import { join, resolve as _resolve, dirname } from 'path';
import { config as _config } from 'dotenv';
import url from 'url';

import autoprefixer from 'autoprefixer';
import liveReload from 'vite-plugin-live-reload';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';

import adapter from '@sveltejs/adapter-static';
import preprocess from 'svelte-preprocess';

const __dirname = dirname(url.fileURLToPath(import.meta.url));
const { dependencies } = JSON.parse(
	readFileSync(join(__dirname, 'package.json'))
);

/**
 * @type {ImportMetaEnv}
 */
const env = _config().parsed;

/**
 * @type {import('vite').UserConfig}
 */
const vite = {
	mode: env.VITE_SERVER_ENV,
	server: {
		https: env.DEV
			? {
					key: readFileSync(join(__dirname, '192.168.43.16-key.pem')),
					cert: readFileSync(join(__dirname, '192.168.43.16.pem')),
			  }
			: false,
		proxy: {
			[env.VITE_SERVER_BASE_API_PATH]: {
				target: env.VITE_SERVER_ORIGIN,
				changeOrigin: true,
				rewrite: (path) => path,
			},
			[env.VITE_SERVER_STATIC_PATH]: {
				target: env.VITE_SERVER_ORIGIN,
				changeOrigin: true,
				rewrite: (path) => path,
			},
			[env.VITE_WS_SERVER_BASE_PATH]: {
				target: env.VITE_WS_SERVER_ORIGIN,
				ws: true,
				changeOrigin: true,
				rewrite: (path) => path,
			},
		},
	},
	resolve: {
		alias: {
			$static: _resolve(__dirname, 'static'),
			$components: _resolve(__dirname, 'src/components'),
			$apis: _resolve(__dirname, 'src/apis'),
			$features: _resolve(__dirname, 'src/features'),
			$server: _resolve(__dirname, '../../'),
		},
	},
	css: {
		postcss: {
			plugins: [autoprefixer],
		},
	},
	plugins: [liveReload.default(['src/routes/**']), viteCommonjs()],
	ssr: {
		noExternal: Object.keys(dependencies || {}),
	},
};

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: preprocess({
		scss: {
			includePaths: [join(__dirname, 'theme')],
		},
		typescript: true,
	}),
	kit: {
		ssr: true,
		hydrate: true,
		adapter: adapter({
			pages: env.VITE_CLIENT_BUILD_DIR,
			assets: env.VITE_CLIENT_BUILD_DIR,
			fallback: null,
		}),
		target: 'body',
		vite,
	},
};

export default config;
