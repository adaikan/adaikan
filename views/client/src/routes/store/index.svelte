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
		mdiImageRemove,
		mdiAccountOutline,
		mdiRefresh,
		mdiMessageTextOutline,
		mdiClipboardTextMultipleOutline,
	} from '@mdi/js';
	import { mdiClipboardTextClockOutline } from '$lib/icons';
	import ProgressLinear from '$components/progress-linear.svelte';
	import NoStore from './_no-store-.svelte';
	import UserUnauthDialog from '$components/user-unauth-dialog.svelte';

	import { Emitter } from '$lib/event-emitter';
	import { APIS_URL } from '$lib/env';

	import { onMount, onDestroy, getContext } from 'svelte';
	import { fade, slide, scale } from 'svelte/transition';
	import { writable, derived } from 'svelte/store';
	import { dev } from '$app/env';
	import { goto } from '$app/navigation';

	import type { SellerClientApi } from './__layout.svelte';

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
	import { page, navigating } from '$app/stores';

	const features = writable([
		{
			name: 'Pesanan',
			icon: mdiClipboardTextOutline,
			link: 'order',
			count: 0,
		},
		{
			name: 'Di Proses',
			icon: mdiCached,
			link: 'process',
			count: 0,
		},
		{
			name: 'Di Kirim',
			icon: mdiTruckOutline,
			link: 'delivery',
			count: 0,
		},
		{
			name: 'Konfirmasi',
			icon: mdiClipboardTextClockOutline,
			link: 'confirm',
			count: 0,
		},
	]);

	let client = getContext<SellerClientApi>('seller');
	let user: SellerClientApi.Seller;
	let orders: SellerClientApi.Order[] = [];
	let sellerName = '';
	let storeName = '';
	let storeImage = '';
	let drawer = false;
	let activeMenu = '';
	let loading = false;
	let showUserUnauthDialog = false;

	$: {
		if ($navigating) {
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
			user = await client.seller.auth();

			if (!user.storeId) {
				throw new Error('No store');
			}

			const store = await client.store.search({
				where: { id: user.storeId },
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
		} catch (error: any) {
			if (error.message == 'No store') {
				noStore.$set({ active: true });
			} else {
				showUserUnauthDialog = true;
			}
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
	main {
		padding: 32px 16px;
		@include main;
	}
	a {
		display: block;
		text-decoration: none;
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
				<Button text fab size="small" depressed on:click="{toggleNavigation}">
					<Icon path="{mdiMenu}" />
				</Button>
			</div>
			<div slot="title">Dashboard</div>
			<div class="space"></div>
			<Menu class="menu" right>
				<div slot="activator">
					<Button text fab size="small" depressed>
						<Icon path="{mdiDotsVertical}" />
					</Button>
				</div>
				<ListItem on:click="{() => location.reload()}">
					<span slot="prepend"
						><Icon label="refresh" path="{mdiRefresh}" /></span
					>
					<span>Refresh</span>
				</ListItem>
			</Menu>
		</AppBar>
		<NavigationDrawer
			class="{loading ? 'top-4' : ''}"
			active="{drawer}"
			index="{4}"
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
			<List class="features">
				{#each $features as item}
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
				{/each}
			</List>
		</main>
		<UserUnauthDialog bind:active="{showUserUnauthDialog}" basepath="/store" />
		<NoStore bind:this="{noStore}" />
	</MaterialAppMin>
</div>
