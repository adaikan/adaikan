<script context="module" lang="ts">
	import { onMount, setContext } from 'svelte';
	import { ClientApi } from '$apis/index';
	import { APIS_URL, FETCH_MODE, WS_URL } from '$lib/env';
	import { user, setting } from '$lib/store';
	import { registerService } from '$lib/service-register';
	import { dev } from '$app/env';

	export type { Setting, User } from '$lib/store';
	export type { ClientApi };
</script>

<script lang="ts">
	const clientApi = new ClientApi({
		base: APIS_URL,
		wsbase: WS_URL,
		debug: dev,
		mode: FETCH_MODE,
		role: 'internal',
		version: 'v0-alpha.1'
	});
	setContext('clientApi', clientApi);
	setContext('user', user);
	setContext('setting', setting);
	onMount(() => {
		clientApi.init();
	});
</script>

<slot />

<style lang="postcss" global>
	@tailwind base;
	@tailwind components;
	@tailwind utilities;
	@tailwind variants;

	body,
	.page {
		display: grid;
		min-height: 100vh;
		max-width: 100vw;
	}
	::-webkit-scrollbar {
		width: 16px;
	}
	::-webkit-scrollbar:hover {
		width: 10px;
	}
	::-webkit-scrollbar-track {
		@apply bg-base-200;
	}
	::-webkit-scrollbar-thumb {
		border: 4px solid transparent;
		border-radius: 100px;
		@apply bg-base-300;
		background-clip: content-box;
	}
	::-webkit-scrollbar-thumb:hover {
		@apply bg-primary;
	}
	.toggle[type='checkbox']:checked:hover {
		background-color: var(--chkbg);
	}
	.toggle[type='checkbox']:checked:focus {
		background-color: var(--chkbg);
	}
	.toggle[type='checkbox']:focus {
		box-shadow: calc(var(--handleoffset) * -1) 0 0 2px hsl(var(--b1)) inset,
			0 0 0 2px hsl(var(--b1)) inset, var(--focus-shadow), 0px 0px 0px 2px hsl(var(--b1)),
			0px 0px 0px 4px hsl(var(--p));
	}
	.toggle[type='checkbox']:checked:focus {
		box-shadow: var(--handleoffset) 0 0 2px hsl(var(--b1)) inset, 0 0 0 2px hsl(var(--b1)) inset,
			var(--focus-shadow), 0px 0px 0px 2px hsl(var(--b1)), 0px 0px 0px 4px hsl(var(--p));
	}
	.toggle[type='checkbox'] {
		background-image: none;
	}
	html {
		scrollbar-width: thin;
		scrollbar-color: #4b5563 #9ca3af;
		transition: scrollbar-color 0.3s ease-out;
	}
	html:hover {
		scrollbar-color: #456bba #9ca3af;
	}
</style>
