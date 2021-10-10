import logo from '$static/logo.png';

import { onMount, onDestroy, getContext } from 'svelte';
import { writable } from 'svelte/store';
import { tweened } from 'svelte/motion';
import { cubicOut } from 'svelte/easing';

import { setting, user } from '$lib/store';
import Sequence from '$lib/sequence-loading';

import type { ClientApi } from '$apis/index';
import type { User, Setting } from '$lib/store';

export type { ClientApi };
export default class {
	logo = logo;
	error = writable('');
	success = writable(false);
	progress = tweened(10, {
		duration: 250,
		easing: cubicOut
	});
	sequence = new Sequence();
	setting = setting;
	user = user;
	clientApi: ClientApi;

	readonly ERROR = { UNAUTH: 'unauth' };

	constructor() {
		this.clientApi = getContext('clientApi');
		this.user = getContext<User>('user');

		this.sequence.progress = 10;
		this.sequence.onProgress = (progress) => {
			this.progress.set(progress);
		};
		this.sequence.start();

		onMount(() => {
			this.main();
		});
		onDestroy(() => {
			this.destroy();
		});
	}
	public async main() {
		try {
			await this.clientApi.ready;
			const user = await this.clientApi.internal.auth();
			this.user.set(user);
			this.success.set(true);
		} catch (error: any) {
			this.sequence.pause();
			if (this.clientApi.stdApi.Error.FailedAuthentication.type == error.type) {
				this.error.set(this.ERROR.UNAUTH);
			} else {
				this.error.set(error.message);
			}
		} finally {}
	}
	public async destroy() {}
}
