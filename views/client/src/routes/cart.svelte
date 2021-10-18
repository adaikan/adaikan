<script context="module" lang="ts">
	import {
		MaterialAppMin,
		Footer,
		Button,
		Icon,
		Divider,
		Checkbox,
	} from 'svelte-materialify/src';
	import CartCard from '$components/cart-card.svelte';
	import Snackbar from '$components/snackbar.svelte';
	import ProgressLinear from '$components/progress-linear.svelte';
	import Appbar from './_appbar.svelte';

	import { onMount, onDestroy, getContext } from 'svelte';
	import { slide } from 'svelte/transition';

	import { Currency, wait } from '$lib/helper';

	import type { ObserverUnsafe } from '$lib/helper';
	import type { BuyerClient } from './__layout.svelte';

	type Cart = BuyerClient.Cart;
	type Item = BuyerClient.SelectedItem & {
		product: BuyerClient.Product;
	};
</script>

<script lang="ts">
	const client = getContext<BuyerClient>('buyer');
	const is_desktop = getContext<ObserverUnsafe<boolean>>('is_desktop');
	let buyer: BuyerClient.Buyer;
	let cart: Cart;
	let items: Item[] = [];
	let fakeData = Array(4);
	let progress: ProgressLinear;
	let snackbar: Snackbar;
	let total = 0;
	let amount = 0;
	let disableButton = true;
	let allowUpdate = false;

	$: loading = progress?.active;
	$: {
		if (cart) {
			wait({
				timeout: 1000,
				delay: 250,
				arg: cart,
				callback: updateCart,
			});
			syncItems(cart.checked);
		}
	}
	$: {
		amount = 0;
		total = 0;
		for (const item of items) {
			if (item.checked) {
				amount++;
				total += (item.amount * +item.product.price) as any;
			}
		}
		wait({
			timeout: 1000,
			delay: 250,
			arg: items,
			callback: updateItems,
		});
		syncCart(items.every((item) => item.checked == true));
	}
	$: {
		if (amount) {
			disableButton = false;
		} else {
			disableButton = true;
		}
	}

	onMount(init);
	onDestroy(release);

	async function init() {
		try {
			await client.ready;
			buyer = await client.auth();
			const result = await client.api.cart.search({
				where: { buyerId: buyer.id },
				include: { selectedItem: { include: { product: true } } },
				rejectOnNotFound: true,
			});
			items = result.selectedItem;
			fakeData = Array(0);
			result.selectedItem = [];
			cart = result;
			await wait({
				timeout: 1500,
				callback: () => {
					allowUpdate = true;
				},
			});
		} catch (error: any) {
			fakeData = Array(0);
		} finally {
			progress.loaded();
		}
	}
	async function release() {}
	async function updateCart(data: Cart) {
		try {
			progress.loading();
			if (!allowUpdate) return;
			await client.api.cart.update({
				where: { id: cart.id },
				data: { checked: data.checked },
			});
		} catch (error: any) {
			snackbar.setText(error.message);
			snackbar.show();
		} finally {
			progress.loaded();
		}
	}
	async function updateItems(data: Item[]) {
		try {
			progress.loading();
			if (!allowUpdate) return;
			await client.api.selectedItem.batch(
				data.map((item) => {
					return {
						update: {
							where: { id: item.id },
							data: { amount: item.amount, checked: item.checked },
						},
					};
				})
			);
		} catch (error: any) {
			snackbar.setText(error.message);
			snackbar.show();
		} finally {
			progress.loaded();
		}
	}
	function syncCart(check: boolean) {
		if (!allowUpdate) return;
		if (cart && cart.checked != check) {
			cart.checked = check;
			cart = cart;
			wait({
				timeout: 1000,
				delay: 250,
				arg: cart,
				callback: updateCart,
			});
		}
	}
	function syncItems(check: boolean) {
		if (!allowUpdate) return;
		for (const item of items) {
			item.checked = check;
		}
		items = items;
	}
	function toMoney(value: any) {
		return 'Rp. ' + Currency.toMoney(value);
	}
	async function downloader(url: string) {
		return URL.createObjectURL(await client.api.product.downloadImage(url));
	}
</script>

<svelte:head>
	<title>Troli</title>
	<meta name="" content="" />
</svelte:head>

<div transition:slide>
	<MaterialAppMin>
		<ProgressLinear
			bind:this="{progress}"
			backgroundColor="secondary-color"
			color="secondary-color"
		/>
		<Appbar
			loading="{$loading}"
			desktop="{$is_desktop}"
			title="{$is_desktop ? '' : 'Troli'}"
			back_nav
		/>
		<main class="main">
			<section class="checked-bar">
				{#if cart}
					<Checkbox bind:checked="{cart.checked}"
						><span class="select-all">Pilih Semua</span></Checkbox>
				{:else}
					<Checkbox><span class="select-all">Pilih Semua</span></Checkbox>
				{/if}
			</section>
			<Divider />
			<section class="carts">
				{#each items as item}
					<div class="cart-item">
						<Checkbox
							bind:checked="{item.checked}"
							disabled="{!item.product.forSale}" />
						<CartCard
							downloader="{downloader}"
							image="{item.product.image}"
							control
							loading="{false}"
							bind:amount="{item.amount}"
							data="{{
								name: item.product.name,
								price: item.product.price,
							}}" />
					</div>
				{/each}
				{#each fakeData as value}
					<div class="cart-item">
						<Checkbox />
						<CartCard />
					</div>
				{/each}
			</section>
		</main>
		<Footer class="white elevation-5">
			<section class="total">
				{#if total}
					<div class="text">Total Harga</div>
					<div class="price">{toMoney(total)}</div>
				{/if}
			</section>
			<section class="btn">
				<a href="/checkout">
					<Button outlined disabled="{disableButton}"
						>Checkout{amount ? `(${amount})` : ''}</Button>
				</a>
			</section>
		</Footer>
		<Snackbar bind:this="{snackbar}" />
	</MaterialAppMin>
</div>

<style lang="scss">
	@import '../components/common';
	@import '../components/skeleton';
	.loading {
		@include loading-sekeleton;
	}
	.main {
		padding: 24px 16px;
		display: grid;
		align-content: start;
		row-gap: 16px;
		@include main;
	}
	.checked-bar {
		padding: 0;
	}
	.carts {
		display: grid;
		row-gap: 16px;
	}
	.cart-item {
		display: grid;
		grid-template-columns: auto 1fr;
	}
	.total {
		display: grid;
		row-gap: 4px;
		place-items: center start;
		width: 50%;
		.text {
			line-height: normal;
			font-size: 14.8px;
			font-weight: 400;
		}
		.price {
			line-height: normal;
			font-size: 14.8px;
			font-weight: 600;
		}
	}
	.btn {
		display: grid;
		place-items: center;
		width: calc(50% - 8px * 2);
		padding: 0 8px;
		a {
			display: grid;
			width: stretch;
			text-decoration: none;
		}
	}
	* :global {
		@include common-app;
		@include common-loader;
		@include common-footer;
	}
</style>
