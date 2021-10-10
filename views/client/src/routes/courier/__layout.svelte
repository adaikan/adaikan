<script context="module" lang="ts">
	import { setContext, onMount } from 'svelte';
	
	import { dev } from '$app/env';
	import { APIS_URL, WS_URL, FETCH_MODE } from '$lib/env';
	import { CourierClientApi } from '$lib/courier';

	const api = new CourierClientApi({
		base: APIS_URL,
		wsbase: WS_URL,
		debug: dev,
		mode: FETCH_MODE,
		role: 'courier',
		version: 'v0-alpha.1',
	});

	export type { CourierClientApi };
</script>

<script>
	setContext('courier', api);
	onMount(() => {
		api.init();
	});
</script>

<slot />
