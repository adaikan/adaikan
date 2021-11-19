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

	import type { CourierClientApi } from '../__layout.svelte';
	import type { Service } from '../../__layout.svelte';

	let theme = writable<'light' | 'dark'>('light');
	let showProgress = writable(true);
	let progress = writable(0);
	let indeterminate = writable(true);
</script>

<script lang="ts">
	import { page, navigating } from '$app/stores';

	const client = getContext<CourierClientApi>('courier');
	const service = getContext<Service>('service');
	const menu = [
		{
			name: 'Akun Saya',
			icon: mdiAccountOutline,
			sub: [
				{
					name: 'Profil',
					async action() {
						goto('/courier/account/profile');
					},
				},
				{
					name: 'Ubah Password',
					async action() {
						goto('/courier/account/change-password');
					},
				},
			],
			action() {},
		},
		{
			name: 'Pengaturan',
			icon: mdiCogOutline,
			async action() {
				goto('/courier/account/setting');
			},
		},
		{
			name: 'Keluar',
			icon: mdiLogout,
			async action() {
				loading();
				service.unsubscribe({ nodeId: user.chatNodeId });
				service.unregister();
				await client.courier.token.remove();
				await goto('/courier/entry', { replaceState: true });
			},
		},
		{
			name: 'Hapus Akun',
			icon: mdiDeleteOutline,
			async action() {
				await client.courier.unregister({
					username: user.username,
					password: user.password,
				});
				await client.courier.token.remove();
				await goto('/courier/entry', { replaceState: true });
			},
		},
	];
	let user: CourierClientApi.Courier;
	let imageUrl = '';
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
			user = await client.courier.auth();

			if (user.image) {
				imageUrl = user.image;
			}
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
</script>

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
	.thumb {
		object-fit: cover;
		object-position: center;
		width: 100%;
		border-radius: 50%;
		aspect-ratio: 1;
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
	}
</style>

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
			color="secondary-color"
		/>
		<AppBar class="primary-color {$showProgress ? 'top-4' : ''}">
			<span slot="icon">
				<Button fab icon text size="small" on:click="{() => history.back()}">
					<Icon path="{mdiChevronLeft}" />
				</Button>
			</span>
			<span slot="title">Akun</span>
		</AppBar>
		<main class="main">
			{#if user}
				<div class="card">
					<div class="profile">
						{#if imageUrl}
							<img
								class="thumb"
								src="{imageUrl}"
								alt="{user.name ?? ''}"
								on:error="{() => (imageUrl = '')}"
							/>
						{:else}
							<Avatar class="thumb">
								<Icon path="{mdiAccountCircleOutline}" />
							</Avatar>
						{/if}
						<div class="text">
							<div class="t-2">{user.name ?? '-'}</div>
							<div class="t-3">{user.telp ?? '-'}</div>
							<div class="t-3">{user.place ?? '-'}</div>
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
									on:click="{item.action}"
								>
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
									on:click="{item.action}"
								>
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
