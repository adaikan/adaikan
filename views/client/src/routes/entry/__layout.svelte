<script context="module" lang="ts">
	import { onMount, onDestroy, setContext, getContext } from 'svelte';
	import { writable } from 'svelte/store';
	import { fade, slide, scale } from 'svelte/transition';
	import { getStores, navigating, page, session } from '$app/stores';
	import { dev } from '$app/env';
	import { goto } from '$app/navigation';

	import { APIS_URL } from '$lib/env';
	import ClientApi from '$lib/client-api';
	import UserStore from '$lib/token';
	import Buyer from '$apis/buyer';

	export interface Context {
		buyer: Buyer;
	}

	import logo from '$static/logo.png';

	export { logo };

	const clientApi = new ClientApi({ base: APIS_URL, version: 'v0-alpha.1' });
	const store = new UserStore('buyer', { debug: dev });
	const buyer = new Buyer(clientApi, store);
</script>

<script lang="ts">
	setContext<Context>('layout', {
		buyer,
	});
	onMount(init);
	onDestroy(release);
	function init() {
		buyer.init();
	}
	function release() {}
</script>

<slot />

<style lang="scss"></style>
