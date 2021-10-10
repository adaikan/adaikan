<script context="module" lang="ts">
	import {
		MaterialAppMin,
		ProgressLinear,
		AppBar,
		Footer,
		Button,
		Icon,
		Menu,
		ListItem,
		NavigationDrawer,
		Avatar,
		List,
		ListItemGroup,
		Divider,
		Overlay,
		Badge,
		TextField,
		Checkbox,
	} from 'svelte-materialify/src';
	import {
		mdiMenu,
		mdiDotsVertical,
		mdiViewGridOutline,
		mdiClipboardTextOutline,
		mdiSync,
		mdiCheck,
		mdiTruckOutline,
		mdiCubeOutline,
		mdiAccount,
		mdiRefresh,
		mdiMagnify,
		mdiImageRemove,
		mdiChevronLeft,
		mdiImageBrokenVariant,
		mdiMapMarkerOutline,
		mdiStorefrontOutline,
	} from '@mdi/js';
	import Snackbar from './_snackbar.svelte';

	import { onMount, onDestroy, getContext } from 'svelte';
	import { writable } from 'svelte/store';
	import { fade, slide } from 'svelte/transition';
	import { browser, dev } from '$app/env';
	import { goto } from '$app/navigation';
	import { assets } from '$app/paths';
	import { Promiseify } from '$lib/helper';
	import navigation from '$lib/detail-nav';
	import { Currency } from '$lib/helper';
	import { page, navigating } from '$app/stores';

	import type { BuyerClient } from '../__layout.svelte';

	const theme = writable<'light' | 'dark'>('light');
	const showProgress = writable(true);
	const progress = writable(0);
	const indeterminate = writable(true);
</script>

<script lang="ts">
	const client = getContext<BuyerClient>('buyer');
	let product: (BuyerClient.Product & { store: BuyerClient.Store }) | null;
	let snackbar: Snackbar;
	let id = +$page.params.id;

	$: image = product?.image;

	navigation[0].action = chat;
	navigation[1].action = addToCart;
	navigating.subscribe((value) => value && loading());

	onMount(init);
	onDestroy(release);
	async function init() {
		try {
			await client.ready;
			product = await client.api.product.get(id);
			if (!product) throw new Error('Produk tidak ditemukan');
		} catch (error: any) {
			snackbar.setState('error');
			snackbar.setText(error.message);
			snackbar.show();
		} finally {
			loaded();
		}
	}
	async function release() {}
	function loading() {
		$showProgress = true;
	}
	function loaded() {
		$showProgress = false;
	}
	function toMoney(value: any) {
		return 'Rp. ' + Currency.toMoney(value);
	}
	async function chat(event: Event) {
		try {
			loading();
			event.preventDefault();

			if (!product) throw new Error('Produk tidak ditemukan');

			await client.auth();

			goto('/chat/' + product.store.chatNodeId);
		} catch (error: any) {
			if (error.type == client.Error.FailedAuthentication.type) {
				snackbar.setText('Belum masuk');
				snackbar.setState('login');
			} else {
				snackbar.setText(error.message);
				snackbar.setState('error');
			}
		} finally {
			snackbar.show();
			loaded();
		}
	}
	async function addToCart(event: Event) {
		try {
			loading();
			event.preventDefault();

			if (!product) throw new Error('Produk tidak ditemukan');

			const buyer = await client.auth();
			const cart = await client.api.cart.search({
				where: { buyerId: buyer.id },
			});

			if (cart) {
				const selectedItem = await client.api.selectedItem.search({
					where: { AND: [{ cartId: cart.id }, { productId: product.id }] },
				});
				if (selectedItem) {
					throw new Error('Item sudah ada');
				} else {
					const selectedItem = await client.api.selectedItem.create({
						data: { amount: 1, checked: false, productId: product.id },
					});
					await client.api.cart.update({
						where: { id: cart.id },
						data: { selectedItem: { connect: { id: selectedItem.id } } },
					});
				}
			} else {
				await client.api.cart.create({
					data: {
						checked: false,
						buyerId: buyer.id,
						selectedItem: {
							create: { amount: 1, checked: false, productId: product.id },
						},
					},
				});
			}
			snackbar.setText('Berhasil tambah keranjang');
			snackbar.setState('success');
		} catch (error: any) {
			if (error.type == client.Error.FailedAuthentication.type) {
				snackbar.setText('Belum masuk');
				snackbar.setState('login');
			} else if (error.message == 'Item sudah ada') {
				snackbar.setText(error.message);
				snackbar.setState('success');
			} else {
				snackbar.setText(error.message);
				snackbar.setState('error');
			}
		} finally {
			snackbar.show();
			loaded();
		}
	}
</script>

<style lang="scss">
	@import '../../components/common';
	@import '../../components/skeleton';
	.loading {
		@include loading-sekeleton;
		min-height: 28px;
	}
	main {
		padding: 24px 16px;
		display: grid;
		@include medium-only {
			padding: 24px 48px;
		}
		@include large-only {
			padding: 24px 80px;
		}
		@include very-large-up {
			padding: 24px 15%;
		}
	}
	figure {
		display: grid;
		align-content: start;
		gap: 32px;
		@include medium-only {
			grid-template-columns: 2.5fr 5.5fr;
		}
		@include large-only {
			grid-template-columns: 3.5fr 6.5fr;
			gap: 48px;
		}
		@include very-large-up {
			grid-template-columns: 4.5fr 7.5fr;
			gap: 48px;
		}
	}
	figcaption {
		display: grid;
		row-gap: 28px;
		align-content: start;
	}
	.t-18 {
		font-size: 18px;
		line-height: normal;
	}
	.t-16 {
		font-size: 16px;
		line-height: normal;
	}
	.t-14 {
		font-size: 14.8px;
		line-height: normal;
	}
	.t-500 {
		font-weight: 500;
	}
	.t-400 {
		font-weight: 400;
	}
	.p-8 {
		opacity: 0.8;
	}
	a {
		text-decoration: none;
	}
	.section {
		display: grid;
		row-gap: 16px;
	}
	.subsection {
		display: grid;
		row-gap: 8px;
	}
	.column {
		display: grid;
		grid-auto-flow: column;
		grid-template-columns: 1fr 1fr;
		column-gap: 16px;
		justify-content: space-between;
		.start {
			justify-self: start;
		}
		.end {
			justify-self: end;
		}
	}
	.image {
		@include image(4/3);
	}
	.nav {
		display: grid;
		place-items: center;
		width: 50%;
		ul {
			padding: 0;
			display: flex;
			justify-content: space-evenly;
			width: stretch;
		}
		li {
			list-style: none;
			padding: 2px;
		}
		a {
			display: grid;
			justify-items: center;
			row-gap: 2px;
			border-radius: 6px;
			text-transform: capitalize;
			font-size: 11px;
		}
	}
	.btn {
		display: grid;
		place-items: center;
		width: 50%;
		a {
			display: grid;
			padding: 0 16px;
			width: stretch;
		}
	}
	* :global {
		@include common-app;
		@include common-loader;
		@include common-appbar;
		@include common-footer {
			.s-btn.icon,
			.s-btn.s-btn--fab {
				border-radius: 6px;
			}
		}
	}
</style>

<svelte:head>
	<title>Detail</title>
	<meta name="" content="" />
</svelte:head>

<div transition:slide>
	<MaterialAppMin theme="{$theme}">
		<ProgressLinear
			bind:active="{$showProgress}"
			bind:indeterminate="{$indeterminate}"
			bind:value="{$progress}"
			height="4px"
			backgroundColor="secondary-color"
			color="secondary-color"
		/>
		<AppBar class="primary-color {$showProgress ? 'top-4' : ''}">
			<span slot="icon">
				<Button fab icon text size="small" on:click="{() => history.back()}">
					<Icon path="{mdiChevronLeft}" />
				</Button>
			</span>
			<span slot="title">Detail</span>
		</AppBar>
		<main>
			<figure>
				{#if product}
					{#if image}
						<img
							class="image"
							src="{image}"
							alt="{product.name}"
							on:error="{() => (image = '')}"
						/>
					{:else}
						<div class="image e">
							<Icon size="{48}" path="{mdiImageRemove}" />
						</div>
					{/if}
					<figcaption>
						<section class="subsection">
							<h1 class="t-18 t-500">{product.name}</h1>
							<section class="subsection">
								<div class="t-16 t-500">{toMoney(product.price)}</div>
								<div class="">
									<Icon path="{mdiStorefrontOutline}" />
									<span class="t-16 p-8">
										{product.store.name}
									</span>
								</div>
								<div class="">
									<Icon path="{mdiMapMarkerOutline}" />
									<span class="t-16 p-8">
										{product.store.area}, {product.store.local}, {product.store
											.place}
									</span>
								</div>
							</section>
						</section>
						<section class="subsection">
							<h2 class="t-18 t-500">Informasi Produk</h2>
							<section class="subsection">
								<div class="column t-14 p-8">
									<span>Berat</span>
									<span class="end t-500"
										>{product.weightUnit}. {product.weight}</span
									>
								</div>
								<div class="column t-14 p-8">
									<span>Tersedia</span>
									<span class="end t-500">{product.stock}</span>
								</div>
								<div class="column t-14 p-8">
									<span>Kondisi</span>
									<span class="end t-500"
										>{product.fresh ? '' : 'Tidak'} Segar</span
									>
								</div>
							</section>
						</section>
					</figcaption>
				{:else}
					<div class="image loading"></div>
					<figcaption>
						<section class="subsection">
							<h1 class="t-18 loading">&nbsp;</h1>
							<section class="subsection">
								<div class="t-16 loading">&nbsp;</div>
								<div class="t-16 loading">&nbsp;</div>
								<div class="t-16 loading">&nbsp;</div>
							</section>
						</section>
						<section class="subsection">
							<h2 class="t-18 loading">&nbsp;</h2>
							<section class="subsection">
								<div class="column t-14">
									<span class="loading">&nbsp;</span>
									<span class="loading">&nbsp;</span>
								</div>
								<div class="column t-14">
									<span class="loading">&nbsp;</span>
									<span class="loading">&nbsp;</span>
								</div>
								<div class="column t-14">
									<span class="loading">&nbsp;</span>
									<span class="loading">&nbsp;</span>
								</div>
							</section>
						</section>
					</figcaption>
				{/if}
			</figure>
		</main>
		<Footer class="footer white elevation-5">
			<nav class="nav">
				<ul>
					{#each navigation as item}
						<li>
							<Button text fab size="small">
								<a
									class="grey-text text-darken-3"
									href="{item.link}"
									on:click="{item.action}"
									><Icon path="{item.icon}" />
									<div>{item.name}</div>
								</a>
							</Button>
						</li>
					{/each}
				</ul>
			</nav>
			<section class="btn">
				<a href="/checkout/{product?.id}">
					<Button outlined>Beli</Button>
				</a>
			</section>
		</Footer>
		<Snackbar bind:this="{snackbar}" let:state>
			{#if state == 'success'}
				<a class="white-text" href="/cart"><Button text>Lihat</Button></a>
			{:else if state == 'login'}
				<a class="white-text" href="/entry/login"><Button text>Masuk</Button></a
				>
			{/if}
		</Snackbar>
	</MaterialAppMin>
</div>
