<script context="module" lang="ts">
	import {
		MaterialAppMin,
		AppBar,
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
		CardActions,
		CardSubtitle,
		CardText,
		CardTitle,
	} from 'svelte-materialify/src';
	import {
		mdiMenu,
		mdiViewDashboardOutline,
		mdiDotsVertical,
		mdiViewGridOutline,
		mdiClipboardTextOutline,
		mdiCached,
		mdiCheck,
		mdiTruckOutline,
		mdiStorefrontOutline,
		mdiCubeOutline,
		mdiFishbowlOutline,
		mdiAccountOutline,
		mdiRefresh,
		mdiPlus,
		mdiChevronLeft,
	} from '@mdi/js';
	import ProgressLinear from '$components/progress-linear.svelte';
	import Cards from '$components/cards.svelte';
	import Card from '$components/card.svelte';

	import { onMount, onDestroy, getContext } from 'svelte';
	import { fade, slide, scale } from 'svelte/transition';
	import { writable, derived } from 'svelte/store';
	import { dev } from '$app/env';
	import { goto } from '$app/navigation';
	import { page, navigating } from '$app/stores';
	import { getImageUrl } from '$lib/helper';

	import type { SellerClientApi } from '../__layout.svelte';

	const navigations = [
		{
			text: 'Dashboard',
			icon: mdiViewDashboardOutline,
			link: '/store',
		},
		{
			text: 'Toko',
			icon: mdiStorefrontOutline,
			link: '/store/detail',
		},
		{
			text: 'Produk',
			icon: mdiViewGridOutline,
			link: '/store/products',
		},
		{
			text: 'Akun',
			icon: mdiAccountOutline,
			link: '/store/account',
		},
	];
	const menus = [
		{
			text: 'Kembali',
			icon: mdiChevronLeft,
			action: () => {
				history.back();
			},
		},
		{
			text: 'Refresh',
			icon: mdiRefresh,
			action: () => {
				location.reload();
			},
		},
		{
			text: 'Tambah',
			icon: mdiPlus,
			action: () => {
				goto('/store/products/add');
			},
		},
	];
	const title = 'Produk';
</script>

<script lang="ts">
	const client = getContext<SellerClientApi>('seller');
	let seller: SellerClientApi.Data.Seller;
	let store: SellerClientApi.Data.Store & {
		product: SellerClientApi.Data.Product[];
	};
	let loader: ProgressLinear;
	let sellerName = '';
	let storeName = '';
	let storeImage = '';
	let drawer = false;
	let activeMenu = '';
	let loading = false;
	$: {
		if (navigating && $navigating) {
			loader.loading();
		}
	}
	onMount(init);
	onDestroy(release);
	async function init() {
		try {
			setActiveMenu();
			loader.active.subscribe((value) => (loading = value));

			await client.ready;
			seller = await client.seller.auth();
			if (!seller.storeId) {
				throw new Error('Toko belum ada');
			}
			store = await client.store.search({
				where: { id: seller.storeId },
				include: { product: true },
				rejectOnNotFound: true,
			});

			sellerName = seller.name ?? '-';
			storeName = store.name;
			storeImage = store.image;
		} catch (error: any) {
		} finally {
			loader.loaded();
		}
	}
	function release() {}
	function toggleNavigation() {
		drawer = !drawer;
	}
	function setActiveMenu() {
		activeMenu = location.pathname;
	}
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="" content="" />
</svelte:head>

<div transition:fade>
	<MaterialAppMin>
		<ProgressLinear bind:this="{loader}" />
		<AppBar class="primary-color {loading ? 'top-4' : ''}">
			<div slot="icon">
				<Button text fab size="small" depressed on:click="{toggleNavigation}">
					<Icon path="{mdiMenu}" />
				</Button>
			</div>
			<div slot="title">{title}</div>
			<div class="space"></div>
			<Menu class="menu" right>
				<div slot="activator">
					<Button text fab size="small" depressed>
						<Icon path="{mdiDotsVertical}" />
					</Button>
				</div>
				{#each menus as menu}
					<ListItem on:click="{menu.action}">
						<span slot="prepend"
							><Icon label="refresh" path="{menu.icon}" /></span>
						<span>{menu.text}</span>
					</ListItem>
				{/each}
			</Menu>
		</AppBar>
		<NavigationDrawer
			class="{loading ? 'top-4' : ''}"
			active="{drawer}"
			index="{4}">
			<header class="header">
				<Avatar>
					{#if storeImage}
						<img
							class=""
							src="{storeImage}"
							alt="{storeName}"
							on:error="{() => (storeImage = '')}" />
					{:else}
						<Icon
							class="grey-text text-darken-2"
							path="{mdiStorefrontOutline}" />
					{/if}
				</Avatar>
				<div class="text">
					<h1 class="title">{sellerName}</h1>
					<h2 class="subtitle">{storeName}</h2>
				</div>
			</header>
			<Divider />
			<List nav dense>
				<ListItemGroup>
					{#each navigations as item}
						<a href="{item.link}">
							<ListItem active="{item.link == activeMenu}">
								<span slot="prepend">
									<Icon path="{item.icon}" />
								</span>
								{item.text}
							</ListItem>
						</a>
					{/each}
				</ListItemGroup>
			</List>
		</NavigationDrawer>
		<Overlay active="{drawer}" on:click="{toggleNavigation}" index="{3}" />
		<main>
			<Cards>
				{#if store}
					{#each store.product as product}
						<a href="/store/products/{product.id}">
							<Card
								data="{{
									image: product.image,
									name: product.name,
									price: product.price,
									store: store.name,
								}}"
								imageLoader="{getImageUrl}" /></a>
					{/each}
				{:else}
					{#each Array(6) as value}
						<Card />
					{/each}
				{/if}
			</Cards>
		</main>
	</MaterialAppMin>
</div>

<style lang="scss">
	@import '../../../components/common';
	main {
		padding: 16px;
		@include main;
	}
	a {
		text-decoration: none;
		color: inherit;
	}
	* :global {
		@include common-app {
			background-color: #f7f7f7;
		}
		@include common-appbar {
			.space {
				flex-grow: 1;
			}
		}
		.s-navigation-drawer {
			position: fixed;
			.top-4 {
				top: 4px;
			}
			.header {
				display: flex;
				column-gap: 16px;
				align-items: center;
				padding: 16px;
				.text {
					display: grid;
					row-gap: 4px;
					padding: 8px;
				}
				.title {
					margin: 0;
					font-size: 18px;
					font-weight: 500;
					line-height: normal;
				}
				.subtitle {
					margin: 0;
					font-size: 14px;
					font-weight: 400;
					line-height: normal;
					opacity: 0.9;
				}
			}
			a {
				margin: 4px 0;
			}
		}
		.menu {
			.s-list-item .s-icon {
				margin-right: 16px;
			}
		}
	}
</style>
