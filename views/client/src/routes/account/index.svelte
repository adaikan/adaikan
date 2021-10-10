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
		TextField,
		Checkbox,
	} from 'svelte-materialify/src';
	import UserUnauthDialog from '$components/user-unauth-dialog.svelte';
	import DeleteAccountDialog from '$components/delete-account-dialog.svelte';
	import Snackbar from '$components/snackbar.svelte';
	import RegisterSeller from './_register-seller.svelte';
	import LoginSeller from './_login-seller.svelte';
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
		mdiDeleteOutline,
		mdiChevronLeft,
		mdiChevronRight,
		mdiAccountCircleOutline,
	} from '@mdi/js';

	import { onMount, onDestroy, getContext } from 'svelte';
	import { derived, writable } from 'svelte/store';
	import { fade, slide } from 'svelte/transition';
	import { browser, dev } from '$app/env';
	import { goto } from '$app/navigation';
	import { assets } from '$app/paths';
	import { page } from '$app/stores';
	import { APIS_URL, FETCH_MODE } from '$lib/env';
	import { SellerClientApi } from '$lib/seller';

	import type { BuyerClient } from '../__layout.svelte';

	let theme = writable<'light' | 'dark'>('light');
	let showProgress = writable(true);
	let progress = writable(0);
	let indeterminate = writable(true);
</script>

<script lang="ts">
	const buyer = getContext<BuyerClient>('buyer');
	const profile = writable(buyer.get());
	let address: BuyerClient.Address | null;
	let snackbar: Snackbar;
	const menu = [
		{
			name: 'Akun Saya',
			icon: mdiAccountOutline,
			sub: [
				{
					name: 'Profile',
					async action() {
						await navigate('/account/profile');
					},
				},
				{
					name: 'Alamat',
					async action() {
						await navigate('/account/address');
					},
				},
				{
					name: 'Ubah Password',
					async action() {
						await navigate('/account/change-password');
					},
				},
			],
			action() {},
		},
		{ name: 'Notifikasi', icon: mdiBellOutline, sub: [], action() {} },
		{
			name: 'Pesanan Saya',
			icon: mdiClipboardListOutline,
			sub: [],
			async action() {
				await navigate('/order');
			},
		},
		{
			name: 'Jualan Saya',
			icon: mdiTagOutline,
			sub: [
				{
					name: 'Mulai Jual',
					async action() {
						const api = new SellerClientApi({
							base: APIS_URL,
							debug: dev,
							mode: FETCH_MODE,
							role: 'seller',
							version: 'v0-alpha.1',
						});
						try {
							loading();
							const token = await api.init().seller.token.retrieve();
							let user: BuyerClient.Seller | null;
							if (token) {
								try {
									user = await api.seller.auth();
									return goto('/store');
								} catch (error: any) {
									if (
										error.type == api.seller.api.Error.FailedAuthentication.type
									) {
										await api.seller.token.remove();
									} else {
										throw error;
									}
								}
							}
							user = await api.seller.search({
								where: { username: $profile.username },
							});
							if (user) {
								loginSeller.$set({
									active: true,
									data: { username: user.username },
								});
								loginSeller.$on('submit', async (event) => {
									try {
										loading();
										loginSeller.resetMessage();
										await api.seller.login({
											username: event.detail.username,
											password: event.detail.password,
										});
										loginSeller.$set({
											message: {
												show: true,
												state: 'success',
												text: 'Berhasil Masuk',
											},
										});
										setTimeout(() => {
											navigate('/store');
										}, 1000);
									} catch (error: any) {
										loginSeller.$set({
											message: {
												show: true,
												state: 'error',
												text: error.message,
											},
										});
									} finally {
										loaded();
									}
								});
							} else {
								registerSeller.$set({
									active: true,
									data: {
										email: $profile.email,
										username: $profile.username,
									},
								});
								registerSeller.$on('submit', async (event) => {
									try {
										loading();
										await api.seller.register({
											email: event.detail.email,
											username: event.detail.username,
											password: event.detail.password,
										});
										registerSeller.$set({
											message: {
												show: true,
												state: 'success',
												text: 'Berhasil Mendaftar',
											},
										});
										setTimeout(() => {
											navigate('/store');
										}, 1000);
									} catch (error: any) {
										registerSeller.$set({
											message: {
												show: true,
												state: 'error',
												text: error.message,
											},
										});
									} finally {
										loaded();
									}
								});
							}
						} catch (error: any) {
							snackbar.setText(error.message);
							snackbar.show();
						} finally {
							loaded();
						}
					},
				},
			],
			action() {},
		},
		{
			name: 'Keluar',
			icon: mdiLogout,
			sub: [],
			async action() {
				loading();
				await buyer.logout();
				await goto('/', { replaceState: true });
			},
		},
		{
			name: 'Hapus Akun',
			icon: mdiDeleteOutline,
			sub: [],
			action() {
				showDeleteAccountDialog = true;
			},
		},
	];
	let imageUrl = '';
	let showDeleteAccountDialog = false;
	let showUserUnauthDialog = false;
	let registerSeller: RegisterSeller;
	let loginSeller: LoginSeller;
	onMount(init);
	onDestroy(release);
	async function init() {
		try {
			if (!$profile) {
				await buyer.ready;
				$profile = await buyer.auth();
				buyer.set($profile);
			}
			imageUrl = $profile.image ?? '';
			address = await buyer.api.address.search({where: {
				selected: true,
			}});
		} catch (error: any) {
			console.error(error);
			switch (error.type) {
				case buyer.Error.FailedAuthentication.type:
					showUserUnauthDialog = true;
					break;

				default:
					break;
			}
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
	function navigate(
		href: string,
		opts?:
			| {
					replaceState?: boolean | undefined;
					noscroll?: boolean | undefined;
					keepfocus?: boolean | undefined;
					state?: any;
			  }
			| undefined
	) {
		loading();
		return goto(href, opts);
	}
	async function unregister() {
		loading();
		await buyer.logout();
		goto('/');
	}
</script>

<svelte:head>
	<title>Akun</title>
	<meta name="" content="" />
</svelte:head>

<div transition:slide>
	<MaterialAppMin theme="{$theme}">
		<ProgressLinear
			bind:active="{$showProgress}"
			bind:indeterminate="{$indeterminate}"
			bind:value="{$progress}"
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
			{#if $profile}
				<Card tile>
					<div class="profile">
						{#if imageUrl}
							<img class="thumb" src="{imageUrl}" alt="" />
						{:else}
							<Avatar class="thumb">
								<Icon path="{mdiAccountCircleOutline}" />
							</Avatar>
						{/if}
						<div class="text">
							<div class="t-2">{$profile.name ?? '-'}</div>
							<div class="t-3">{address?.place || '-'}</div>
							<div class="t-3">{$profile.telp ?? '-'}</div>
						</div>
					</div>
				</Card>
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
			{/if}
			<section class="menu">
				<List>
					{#each menu as item}
						{#if item.sub.length}
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
		</main>
		<Snackbar bind:this="{snackbar}" />
		<RegisterSeller bind:this="{registerSeller}" />
		<LoginSeller bind:this="{loginSeller}" />
		<DeleteAccountDialog
			bind:active="{showDeleteAccountDialog}"
			on:granted="{unregister}" />
		<UserUnauthDialog bind:active="{showUserUnauthDialog}" />
	</MaterialAppMin>
</div>

<style lang="scss">
	@import '../../components/common';
	@import '../../components/skeleton';
	.loading {
		@include loading-sekeleton;
	}
	.main {
		padding: 16px 0;
		display: grid;
		align-content: start;
		row-gap: 16px;
		@include main;
	}
	.profile {
		padding: 16px;
		display: grid;
		grid-template-columns: 1fr 4fr;
		grid-template-rows: 1fr;
		column-gap: 8px;
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
	.thumb {
		object-fit: contain;
		object-position: center;
		aspect-ratio: 1;
		border-radius: 50%;
	}
	.t-1 {
		font-size: 20px;
		font-weight: 500;
		line-height: normal;
		width: stretch;
	}
	.t-2 {
		font-size: 18px;
		font-weight: 500;
		line-height: normal;
		width: stretch;
	}
	.t-3 {
		font-size: 14px;
		font-weight: 500;
		line-height: normal;
		width: stretch;
		opacity: 0.7;
	}
	* :global {
		@include common-app;
		@include common-loader;
		@include common-appbar;
		@include common-footer;
		.thumb {
			width: 100%;
			height: 100%;
			opacity: 0.7;
		}
	}
</style>
