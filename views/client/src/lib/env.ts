/// <reference path="../global.d.ts" />

const {
	VITE_SERVER_DOMAIN,
	VITE_API_SERVER_BASE_PATH,
	VITE_EVENT_SERVER_BASE_PATH,
	VITE_WS_SERVER_BASE_PATH,
	VITE_CLIENT_FETCH_MODE,
	VITE_MAP_KEY,
} = import.meta.env;

export const APIS_URL = VITE_SERVER_DOMAIN + VITE_API_SERVER_BASE_PATH;
export const ES_URL = VITE_EVENT_SERVER_BASE_PATH;
export const WS_URL = VITE_WS_SERVER_BASE_PATH;
export const FETCH_MODE = VITE_CLIENT_FETCH_MODE;
export const MAP_KEY = VITE_MAP_KEY;
