/// <reference types="@sveltejs/kit" />
/// <reference types="svelte" />
/// <reference types="vite/client" />

interface ImportMetaEnv {
	VITE_SERVER_ENV: string;
	VITE_SEVER_CONTEXT: string;
	VITE_SERVER_ORIGIN: string;
	VITE_SERVER_DOMAIN: string;
	VITE_SERVER_BASE_API_PATH: string;
	VITE_WS_SERVER_ORIGIN: string;
	VITE_WS_SERVER_BASE_PATH: string;
	VITE_SERVER_STATIC_PATH: string;
	VITE_CLIENT_FETCH_MODE: RequestMode;
	VITE_CLIENT_BUILD_DIR: string;
	VITE_MAP_KEY: string;
	VITE_EMAIL_KEY: string;
	VITE_PAYMENT_KEY: string;
}

declare module '$service-worker' {
  export const build: string[];
	export const files: string[];
	export const timestamp: number;
}
