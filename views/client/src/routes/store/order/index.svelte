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
	import ProgressLinear from '$components/progress-linear.svelte';
	import NoStore from '../_no-store-.svelte';
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
		mdiChevronLeft,
	} from '@mdi/js';
	import { mdiClipboardTextClockOutline } from '$lib/icons';

	import { onMount, onDestroy, getContext } from 'svelte';
	import { fade, slide, scale } from 'svelte/transition';
	import { writable, derived } from 'svelte/store';
	import { dev } from '$app/env';
	import { goto } from '$app/navigation';
	import { page, navigating } from '$app/stores';

	import type { SellerClientApi } from '../__layout.svelte';

	const title = 'Pesanan';
</script>

<script lang="ts">
	let client = getContext<SellerClientApi>('seller');
	let orders: (SellerClientApi.Data.Order & {
		buyer: SellerClientApi.Data.Buyer;
		item: (SellerClientApi.Data.OrderedItem & {
			product: SellerClientApi.Data.Product;
		})[];
	})[] = [];
	let isLoading = writable(true);
	let user: SellerClientApi.Data.Seller;
	let loader: ProgressLinear;
	let noStore: NoStore;

	$: isLoading = loader?.active;
	$: {
		if ($navigating) {
			loader.loading();
		}
	}

	onMount(init);
	onDestroy(release);

	async function init() {
		try {
			await client.ready;
			user = await client.seller.auth();

			if (!user.storeId) {
				throw new Error('No store');
			}

			const store = await client.store.search({
				where: { id: user.storeId },
				rejectOnNotFound: true,
			});

			orders = await client.order.searchMany({
				where: { AND: [{ storeId: store.id }, { status: 'Queue' }] },
				include: { buyer: true, item: { include: { product: true } } },
			});
		} catch (error: any) {
			if (error.message == 'No store') {
				noStore.$set({ active: true });
			}
		} finally {
			loader.loaded();
		}
	}
	function release() {}
	function getItems(
		order: SellerClientApi.Data.Order & {
			item: (SellerClientApi.Data.OrderedItem & {
				product: SellerClientApi.Data.Product;
			})[];
		}
	) {
		return order.item.reduce(
			(prev, curr) => (prev.push(curr.product.name), prev),
			[] as string[]
		);
	}
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="" content="" />
</svelte:head>

<div transition:slide>
	<MaterialAppMin>
		<ProgressLinear bind:this="{loader}" />
		<AppBar class="primary-color {$isLoading ? 'top-4' : ''}">
			<div slot="icon">
				<Button
					text
					fab
					size="small"
					depressed
					on:click="{() => history.back()}">
					<Icon path="{mdiChevronLeft}" />
				</Button>
			</div>
			<div slot="title">{title}</div>
		</AppBar>
		<main>
			<List class="list">
				{#each orders as order}
					<a href="/store/order/{order.id}">
						<Card link>
							<ListItem>
								<div slot="prepend">
									<Icon path="{mdiClipboardTextOutline}" />
								</div>
								<div>{order.buyer.name ?? '-'}</div>
								<div slot="subtitle">{getItems(order)}</div>
							</ListItem>
						</Card>
					</a>
				{/each}
			</List>
		</main>
		<NoStore bind:this="{noStore}" />
	</MaterialAppMin>
</div>

<style lang="scss">
	@import '../../../components/common';
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
		@include common-appbar;
		.list {
			display: grid;
			gap: 16px;
			.s-badge {
				width: 100%;
			}
			.s-list-item__title,
			.s-list-item__subtitle {
				line-height: normal;
			}
		}
	}
</style>
