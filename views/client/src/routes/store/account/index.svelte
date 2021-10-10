<script context="module" lang="ts">
	import {
		MaterialAppMin,
		ProgressLinear,
		AppBar,
		Footer,
		Button,
		Icon,
		Menu,
		NavigationDrawer,
		Avatar,
		List,
		ListGroup,
		ListItem,
		ListItemGroup,
		Card,
		Divider,
		TextField,
		Checkbox,
	} from 'svelte-materialify/src';
	import UserUnauthDialog from '$components/user-unauth-dialog.svelte';
	import {
		mdiAccountOutline,
		mdiClipboardListOutline,
		mdiBellOutline,
		mdiTagOutline,
		mdiLogout,
		mdiAccountCircle,
		mdiMapMarkerRadiusOutline,
		mdiCheck,
		mdiEyeOff,
		mdiEye,
		mdiStorefrontOutline,
		mdiDeleteOutline,
		mdiChevronLeft,
		mdiChevronRight,
		mdiAccountCircleOutline,
		mdiCogOutline,
	} from '@mdi/js';

	import { onMount, onDestroy, getContext } from 'svelte';
	import { writable } from 'svelte/store';
	import { fade, slide } from 'svelte/transition';
	import { browser, dev } from '$app/env';
	import { goto } from '$app/navigation';
	import { assets } from '$app/paths';

	import type { SellerClientApi } from '../__layout.svelte';

	let theme = writable<'light' | 'dark'>('light');
	let showProgress = writable(true);
	let progress = writable(0);
	let indeterminate = writable(true);
</script>

<script lang="ts">
	import { page, navigating } from '$app/stores';

	const client = getContext<SellerClientApi>('seller');
	const menu = [
		{
			name: 'Akun Saya',
			icon: mdiAccountOutline,
			sub: [
				{
					name: 'Profile',
					async action() {
						goto('/store/account/profile');
					},
				},
				{
					name: 'Ubah Password',
					async action() {
						goto('/store/account/change-password');
					},
				},
			],
			action() {},
		},
		{ name: 'Notifikasi', icon: mdiBellOutline, action() {} },
		{
			name: 'Toko Saya',
			icon: mdiStorefrontOutline,
			action() {
				goto('/store/detail');
			},
		},
		{
			name: 'Pengaturan',
			icon: mdiCogOutline,
			async action() {
				goto('/store/account/setting');
			},
		},
		{
			name: 'Keluar',
			icon: mdiLogout,
			async action() {
				loading();
				await client.seller.token.remove();
				await goto('/', { replaceState: true });
			},
		},
		{
			name: 'Hapus Akun',
			icon: mdiDeleteOutline,
			action() {},
		},
	];
	let user: SellerClientApi.Data.Seller;
	let store: SellerClientApi.Data.Store;
	let showUserUnauthDialog = false;

	$: {
		if ($navigating) {
			loading();
		}
	}

	onMount(init);
	onDestroy(release);
	async function init() {
		try {
			await client.ready;
			user = await client.seller.auth();

			if (!user.storeId) {
				return goto('/store', { replaceState: true });
			}

			store = await client.store.search({
				where: { id: user.storeId },
				rejectOnNotFound: true,
			});
		} catch (error: any) {
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
	async function download(url: string) {
		return URL.createObjectURL(await client.store.downloadImage(url));
	}
</script>

<svelte:head>
	<title>Profile</title>
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
			color="secondary-color" />
		<AppBar class="primary-color {$showProgress ? 'top-4' : ''}">
			<span slot="icon">
				<Button fab icon text size="small" on:click="{() => history.back()}">
					<Icon path="{mdiChevronLeft}" />
				</Button>
			</span>
			<span slot="title">Akun</span>
		</AppBar>
		<main class="main">
			{#if user && store}
				<div class="card">
					<div class="profile">
						{#if store.image}
							<img
								class="thumb"
								src="{store.image}"
								alt="{store.name}"
								on:error="{() => (store.image = '')}" />
						{:else}
							<div class="thumb e">
								<Avatar>
									<Icon
										class="grey-text text-darken-2"
										path="{mdiAccountCircleOutline}" />
								</Avatar>
							</div>
						{/if}
						<div class="text">
							<div class="t-2">{user.name ?? '-'}</div>
							<div class="t-3">{store.name ?? '-'}</div>
							<div class="t-3">{store.place ?? '-'}</div>
						</div>
					</div>
				</div>
				<section class="menu">
					<List>
						{#each menu as item, index}
							{#if index}
								<Divider />
							{/if}
							{#if item.sub}
								<ListGroup
									active="{false}"
									offset="{72}"
									on:click="{item.action}">
									<span slot="prepend">
										<Icon path="{item.icon}" />
									</span>
									<span slot="activator">{item.name}</span>
									{#each item.sub as sub}
										<ListItem on:click="{sub.action}">{sub.name}</ListItem>
									{/each}
									<span slot="append">
										<Icon path="{mdiChevronRight}" />
									</span>
								</ListGroup>
							{:else}
								<ListItem
									active="{false}"
									activeClass=""
									on:click="{item.action}">
									<span slot="prepend">
										<Icon path="{item.icon}" />
									</span>
									<span>{item.name}</span>
								</ListItem>
							{/if}
						{/each}
					</List>
				</section>
			{:else}
				<Card tile>
					<div class="profile">
						<div class="thumb loading">&nbsp;</div>
						<div class="text">
							<div class="t-2 loading">&nbsp;</div>
							<div class="t-3 loading">&nbsp;</div>
							<div class="t-3 loading">&nbsp;</div>
						</div>
					</div>
				</Card>
				<section class="list">
					{#each menu as item}
						<div class="item loading">&nbsp;</div>
					{/each}
				</section>
			{/if}
		</main>
		<UserUnauthDialog bind:active="{showUserUnauthDialog}" />
	</MaterialAppMin>
</div>

<style lang="scss">
	@import '../../../components/common';
	@import '../../../components/skeleton';
	@import '../../../components/elevation';
	.loading {
		@include loading-sekeleton;
	}
	.main {
		padding: 24px 16px;
		display: grid;
		align-content: start;
		row-gap: 24px;
		@include main;
	}
	.profile {
		padding: 16px;
		display: grid;
		grid-template-columns: 1fr 4fr;
		grid-template-rows: 1fr;
		column-gap: 16px;
		@include medium-only {
			grid-template-columns: 1fr 5fr;
		}
		@include large-only {
			grid-template-columns: 1fr 7fr;
		}
		@include very-large-up {
			grid-template-columns: 1fr 11fr;
		}
		.text {
			display: grid;
			align-content: space-around;
		}
	}
	.card {
		@include elevation;
		border-radius: 6px;
	}
	.thumb,
	:global(.thumb) {
		@include image(1, 50%);
	}
	.t-1 {
		font-size: 20px;
		font-weight: 500;
		line-height: normal;
		width: stretch;
	}
	.t-2 {
		font-size: 16px;
		font-weight: 500;
		line-height: normal;
		width: stretch;
		opacity: 0.9;
	}
	.t-3 {
		font-size: 14px;
		font-weight: 500;
		line-height: normal;
		width: stretch;
		opacity: 0.7;
	}
	.list {
		display: grid;
		row-gap: 16px;
	}
	.item {
		height: 48px;
	}
	* :global {
		@include common-app;
		@include common-loader;
		@include common-appbar;
		@include common-footer;
		.s-list-item__title, .s-list-item__subtitle {
			line-height: normal;
		}
	}
</style>
