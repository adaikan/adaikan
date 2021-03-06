<script context="module" lang="ts">
	import { setContext, onMount } from 'svelte';
	import { dev } from '$app/env';
	import { APIS_URL, WS_URL, FETCH_MODE } from '$lib/env';
	import { mediaQuery, ObserverUnsafe } from '$lib/helper';
	import Token from '$lib/token';
	import Api from '$lib/client-api';
	import { Service } from '$lib/service-register';
	import BuyerApi from '$apis/buyer';
	import AddressApi from '$apis/buyer-address';
	import CartApi from '$apis/cart';
	import ProductApi from '$apis/product';
	import StoreApi from '$apis/store';
	import RatingApi from '$apis/rating';
	import SelectedItemApi from '$apis/selected-item';
	import OrderApi from '$apis/order';
	import BusinessApi from '$apis/business';
	import ChatApi from '$apis/chat';
	import { BuyerClient } from '$lib/buyer';

	export type { BuyerClient, Service };

	const token = new Token('buyer', { debug: dev });
	const api = new Api({
		base: APIS_URL,
		wsbase: WS_URL,
		version: 'v0-alpha.1',
		mode: FETCH_MODE,
		debug: dev,
	});
	const buyerApi = new BuyerApi(api, token);
	const addressApi = new AddressApi(api, token);
	const cartApi = new CartApi(api, token);
	const productApi = new ProductApi(api, token);
	const storeApi = new StoreApi(api, token);
	const ratingApi = new RatingApi(api, token);
	const selectedItemApi = new SelectedItemApi(api, token);
	const orderApi = new OrderApi(api, token);
	const businessApi = new BusinessApi(api, token);
	const chatApi = new ChatApi(api, token);
	const buyer = new BuyerClient({
		buyer: buyerApi,
		address: addressApi,
		cart: cartApi,
		product: productApi,
		store: storeApi,
		rating: ratingApi,
		selectedItem: selectedItemApi,
		order: orderApi,
		business: businessApi,
		chat: chatApi,
	});
	const is_desktop = new ObserverUnsafe(false);
	const service = new Service({debug: dev});
</script>

<script>
	setContext('buyer', buyer);
	setContext('is_desktop', is_desktop);
	setContext('service', service);
	onMount(() => {
		buyer.init();
		mediaQuery('(min-width: 1200px)', (media) => {
			is_desktop.set(media.matches);
			media.addEventListener('change', (event) => {
				is_desktop.set(media.matches);
			});
		});
		service.init();
	});
</script>

<style lang="scss" global>
	html {
		scrollbar-width: thin;
		scrollbar-color: #00796b9e #d3d3d3;
		transition: scrollbar-color ease 250ms;
	}
	::-webkit-scrollbar {
		width: 10px;
	}
	::-webkit-scrollbar-track {
		background-color: #d3d3d3;
		transition: background-color ease 250ms;
		&:hover {
			background-color: #bdbdbd;
		}
	}
	::-webkit-scrollbar-thumb {
		background-color: #00796b9e;
		transition: background-color ease 250ms;
		border-radius: 2px;
		&:hover {
			background-color: var(--secondary-color);
		}
	}
</style>

<slot />
