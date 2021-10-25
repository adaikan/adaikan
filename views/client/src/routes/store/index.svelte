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
		Card,
		Badge,
		CardActions,
		CardSubtitle,
		CardText,
		CardTitle,
	} from 'svelte-materialify/src';
	import {
		mdiHome,
		mdiMenu,
		mdiViewDashboardOutline,
		mdiDotsVertical,
		mdiViewGridOutline,
		mdiClipboardTextOutline,
		mdiCached,
		mdiTruckOutline,
		mdiStorefrontOutline,
		mdiAccountOutline,
		mdiRefresh,
		mdiMessageTextOutline,
		mdiClipboardTextMultipleOutline,
	} from '@mdi/js';
	import { mdiClipboardTextClockOutline } from '$lib/icons';
	import ProgressLinear from '$components/progress-linear.svelte';
	import NoStore from './_no-store-.svelte';
	import UserUnauthDialog from '$components/user-unauth-dialog.svelte';
	import Cards from '$components/cards.svelte';
	import CardProduct from '$components/card.svelte';

	import { onMount, onDestroy, getContext } from 'svelte';
	import { fade, slide, scale } from 'svelte/transition';
	import { writable, derived } from 'svelte/store';
	import { dev } from '$app/env';
	import { goto } from '$app/navigation';

	import logo from '$static/logo.png';

	import type { ObserverUnsafe } from '$lib/helper';
	import type { SellerClientApi } from './__layout.svelte';
	import type { Service } from '../__layout.svelte';

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
			text: 'Pesan',
			icon: mdiMessageTextOutline,
			link: '/store/chat',
		},
		{
			text: 'Pesanan',
			icon: mdiClipboardTextMultipleOutline,
			link: '/store/order/all',
		},
		{
			text: 'Akun',
			icon: mdiAccountOutline,
			link: '/store/account',
		},
	];
	let loader: ProgressLinear;
	let noStore: NoStore;
</script>

<script lang="ts">
	const service = getContext<Service>('service');
	const is_desktop = getContext<ObserverUnsafe<boolean>>('is_desktop');
	const features = writable([
		{
			name: 'Pesanan',
			desc: 'Pesanan Menunggu',
			icon: mdiClipboardTextOutline,
			link: 'order',
			count: 0,
		},
		{
			name: 'Di Proses',
			desc: 'Sedang di Proses',
			icon: mdiCached,
			link: 'process',
			count: 0,
		},
		{
			name: 'Di Kirim',
			desc: 'Sedang di Kirim',
			icon: mdiTruckOutline,
			link: 'delivery',
			count: 0,
		},
		{
			name: 'Konfirmasi',
			desc: 'Menunggu Konfirmasi',
			icon: mdiClipboardTextClockOutline,
			link: 'confirm',
			count: 0,
		},
	]);

	let client = getContext<SellerClientApi>('seller');
	let user: SellerClientApi.Seller;
	let store: SellerClientApi.Store & {
		product: SellerClientApi.Product[];
	};
	let orders: SellerClientApi.Order[] = [];
	let sellerName = '';
	let storeName = '';
	let storeImage = '';
	let activeMenu = '';
	let loading = false;
	let showUserUnauthDialog = false;

	$: drawer = $is_desktop;

	onMount(init);
	onDestroy(release);

	async function init() {
		try {
			setActiveMenu();
			loader.active.subscribe((value) => (loading = value));

			await client.ready;
			user = await client.seller.auth();

			if (!user.storeId) {
				throw new Error('No store');
			}

			store = await client.store.search({
				where: { id: user.storeId },
				include: { product: true },
				rejectOnNotFound: true,
			});

			sellerName = user.name ?? '-';
			storeName = store.name;
			storeImage = store.image;

			orders = await client.order.searchMany({
				where: { AND: [{ storeId: store.id }, { status: { not: 'Done' } }] },
			});

			type Item = {
				name: string;
				icon: string;
				link: string;
				desc: string;
				count: number;
			};

			const queue = $features.find((item) => item.link == 'order') as Item;
			const process = $features.find((item) => item.link == 'process') as Item;
			const delivery = $features.find(
				(item) => item.link == 'delivery'
			) as Item;
			const confirm = $features.find((item) => item.link == 'confirm') as Item;

			for (const order of orders) {
				if (order.status == 'Queue') {
					if (queue) {
						queue.count++;
					}
				} else if (order.status == 'Process') {
					if (process) {
						process.count++;
					}
				} else if (order.status == 'Delivery') {
					if (delivery) {
						delivery.count++;
					}
				} else if (order.status == 'Confirm') {
					if (confirm) {
						confirm.count++;
					}
				}
			}

			$features = [queue, process, delivery, confirm];

			service.register('service-worker.js');
			service.subscribe({
				role: 'buyer',
				userId: user.id,
				nodeId: store.chatNodeId,
			});
		} catch (error: any) {
			if (error.message == 'No store') {
				noStore.$set({ active: true });
			} else {
				showUserUnauthDialog = true;
			}
			service.unregister();
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

<style lang="scss">
	@import '../../components/common';
	a {
		display: block;
		text-decoration: none;
	}
	main {
		@extend .f-grow;
		padding: 32px 16px;
		display: flex;
		flex-flow: column;
		gap: 24px;
		a {
			color: inherit;
		}
	}
	.content {
		display: flex;
		gap: 16px;
		&.multi {
			display: grid;
			grid-template-columns: 2.5fr 9.5fr;
		}
	}
	.f-grow {
		flex-grow: 1;
	}
	* :global {
		@include common-app {
			background-color: #f7f7f7;
		}
		@include common-appbar($pad: false) {
			z-index: 2;
			.space {
				flex-grow: 1;
			}
		}
		@include common-drawer;
		.s-list-item__title,
		.s-list-item__subtitle {
			line-height: normal;
		}
		.menu {
			.s-list-item .s-icon {
				margin-right: 16px;
			}
		}
		.features {
			display: grid;
			gap: 16px;
			&.list {
				grid-auto-flow: column;
			}
			a {
				text-decoration: none;
			}
			.s-badge {
				width: 100%;
			}
		}
	}
</style>

<svelte:head>
	<title>Dashboard</title>
	<meta name="" content="" />
</svelte:head>

<div transition:fade>
	<MaterialAppMin>
		<ProgressLinear bind:this="{loader}" />
		<AppBar class="primary-color {loading ? 'top-4' : ''}">
			<div slot="icon">
				{#if !$is_desktop}
					<Button text fab size="small" depressed on:click="{toggleNavigation}">
						<Icon path="{mdiMenu}" />
					</Button>
				{:else}
					<a href="/">
						<img
							src="{logo}"
							alt="Ada Ikan"
							width="32"
							height="32"
							style="margin: 0 8px;"
						/>
					</a>
				{/if}
			</div>
			<div slot="title">Dashboard</div>
			<div class="space"></div>
			<Menu class="menu" right>
				<div slot="activator">
					<Button text fab size="small" depressed>
						<Icon path="{mdiDotsVertical}" />
					</Button>
				</div>
				<ListItem on:click="{() => goto('/')}">
					<span slot="prepend"><Icon label="home" path="{mdiHome}" /></span>
					<span>Home</span>
				</ListItem>
				<ListItem on:click="{() => location.reload()}">
					<span slot="prepend"
						><Icon label="refresh" path="{mdiRefresh}" /></span
					>
					<span>Refresh</span>
				</ListItem>
			</Menu>
		</AppBar>
		{#if !$is_desktop}
			<Overlay active="{drawer}" on:click="{toggleNavigation}" index="{3}" />
		{/if}
		<section class="content {$is_desktop ? 'multi' : ''}">
			<NavigationDrawer
				class="{loading ? 'top-4' : ''}"
				active="{drawer}"
				index="{$is_desktop ? 1 : 4}"
				fixed="{!$is_desktop}"
			>
				<header class="header">
					<Avatar>
						{#if storeImage}
							<img
								class=""
								src="{storeImage}"
								alt="{storeName}"
								on:error="{() => (storeImage = '')}"
							/>
						{:else}
							<Icon
								class="grey-text text-darken-2"
								path="{mdiStorefrontOutline}"
							/>
						{/if}
					</Avatar>
					<div class="text">
						<h1 class="title">{sellerName}</h1>
						<h2 class="subtitle">{storeName}</h2>
					</div>
				</header>
				<Divider />
				<List nav dense="{!$is_desktop}">
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
				</List>
			</NavigationDrawer>
			<main>
				<List class="features {$is_desktop ? 'list' : ''}">
					{#each $features as item}
						{#if $is_desktop}
							<a href="/store/{item.link}">
								<Card link>
									<ListItem>
										<div slot="append">
											<Icon path="{item.icon}" />
										</div>
										<div>{item.name}</div>
										<div>{item.count}</div>
									</ListItem>
								</Card>
							</a>
						{:else}
							<Badge
								class="primary-color"
								bordered
								value="{item.count + ''}"
								active="{item.count > 0}"
								offsetX="{16}"
								offsetY="{16}"
							>
								<a href="/store/{item.link}">
									<Card link>
										<ListItem>
											<div slot="prepend">
												<Icon path="{item.icon}" />
											</div>
											<div>{item.name}</div>
										</ListItem>
									</Card>
								</a>
							</Badge>
						{/if}
					{/each}
				</List>
				<Cards>
					{#if store}
						{#each store.product as product}
							<a href="/store/products/{product.id}">
								<CardProduct
									data="{{
										image: product.image,
										name: product.name,
										price: product.price,
										stock: product.stock,
									}}"
								/></a
							>
						{/each}
					{:else}
						{#each Array(6) as value}
							<CardProduct />
						{/each}
					{/if}
				</Cards>
			</main>
		</section>
		<UserUnauthDialog
			bind:active="{showUserUnauthDialog}"
			basepath="/store"
			role="seller"
		/>
		<NoStore bind:this="{noStore}" />
	</MaterialAppMin>
</div>
