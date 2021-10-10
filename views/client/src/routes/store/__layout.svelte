<script context="module" lang="ts">
	import { setContext, onMount } from 'svelte';
	
	import { dev } from '$app/env';
	import { APIS_URL, WS_URL, FETCH_MODE } from '$lib/env';
	import { SellerClientApi } from '$lib/seller';

	const api = new SellerClientApi({
		base: APIS_URL,
		wsbase: WS_URL,
		debug: dev,
		mode: FETCH_MODE,
		role: 'seller',
		version: 'v0-alpha.1',
	});

	export type { SellerClientApi };
</script>

<script>
	setContext('seller', api);
	onMount(() => {
		api.init();
	});
</script>

<slot />
