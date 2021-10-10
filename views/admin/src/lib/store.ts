import { ObserverUnsafe } from '$lib/helper';
// import { open } from '$lib/db';
import type { ClientApi } from '$apis/index';

export interface MySetting {
	installed: boolean;
	notification: boolean;
	loaded: boolean;
}

export const setting = new ObserverUnsafe<MySetting>({
	installed: false,
	notification: false,
	loaded: false
});
export const user = new ObserverUnsafe<ClientApi.Internal | null>(null);

export type Setting = typeof setting;
export type User = typeof user;
