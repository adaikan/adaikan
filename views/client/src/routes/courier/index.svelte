<script context="module" lang="ts">
	import {
		MaterialAppMin,
		AppBar,
		Button,
		Icon,
		Footer,
		Card,
		List,
		ListItemGroup,
		ListItem,
		Avatar,
		Badge,
	} from 'svelte-materialify/src';
	import {
		mdiChevronLeft,
		mdiMapMarkerRadiusOutline,
		mdiTruckDeliveryOutline,
		mdiHistory,
		mdiClose,
		mdiHomeOutline,
		mdiAccount,
		mdiAccountCogOutline,
		mdiCubeOutline,
		mdiMapMarkerOutline,
		mdiMessageTextOutline,
	} from '@mdi/js';
	import ProgressLinear from '$components/progress-linear.svelte';
	import UserUnauthDialog from '$components/user-unauth-dialog.svelte';
	import InitDialog from './_init-dialog.svelte';

	import { getContext, onMount, onDestroy } from 'svelte';
	import { slide } from 'svelte/transition';
	import { writable } from 'svelte/store';
	import { browser } from '$app/env';
	import { wait, Diff, Currency } from '$lib/helper';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { base } from '$app/paths';

	import type { CourierClientApi } from './__layout.svelte';

	const title = 'Home';
	const navigation = [
		{
			name: 'Home',
			icon: mdiHomeOutline,
			link: `/courier`,
		},
		{
			name: 'Chat',
			icon: mdiMessageTextOutline,
			link: `/courier/chat`,
		},
		{
			name: 'History',
			icon: mdiHistory,
			link: `/courier/history`,
		},
		{
			name: 'Account',
			icon: mdiAccountCogOutline,
			link: `/courier/account`,
		},
	];
</script>

<script lang="ts">
	const client = getContext<CourierClientApi>('courier');
	let user: CourierClientApi.Courier;
	let delivery:
		| (CourierClientApi.Delivery & {
				sender: CourierClientApi.Store;
		  })
		| null;
	let loader: ProgressLinear;
	let path = $page.path;
	let showUserUnauthDialog = false;
	let showInitDialog = false;

	$: isLoading = loader?.active;

	onMount(init);
	onDestroy(release);
	async function init() {
		try {
			await client.ready;
			user = await client.courier.auth();
			if (!user.position.length) {
				showInitDialog = true;
			}
			delivery = await client.delivery.search({
				where: {
					AND: [
						{ courierId: user.id },
						{ status: { notIn: ['Done', 'Reject'] } },
					],
				},
				include: { sender: true },
			});
		} catch (error: any) {
			showUserUnauthDialog = true;
		} finally {
			loader.loaded();
		}
	}
	async function release() {}
</script>

<style lang="scss">
	@import '../../components/common';
	@import '../../components/skeleton';
	.loading {
		@include loading-sekeleton();
	}
	main {
		padding: 16px;
		@include main;
	}
	.nav {
		width: stretch;
		height: stretch;
		display: flex;
		ul {
			flex: 1 1 auto;
			list-style: none;
			padding: 0;
			display: flex;
			align-items: center;
			justify-content: space-around;
		}
		li {
			width: 56px;
			height: 56px;
		}
		a {
			display: grid;
			justify-items: center;
			row-gap: 4px;
			text-decoration: none;
			border-radius: 6px;
			font-size: 10px;
		}
	}
	* :global {
		@include common-app;
		@include common-loader;
		@include common-appbar;
		@include common-footer;
		.nav {
			.s-btn.icon,
			.s-btn.s-btn--fab {
				border-radius: 6px;
			}
		}
		.s-badge {
			width: 100%;
		}
	}
</style>

<svelte:head>
	<title>{title}</title>
	<meta name="" content="" />
</svelte:head>

<div transition:slide>
	<MaterialAppMin>
		<ProgressLinear bind:this="{loader}" />
		<AppBar class="primary-color {$isLoading ? 'top-4' : ''}">
			<!-- <span slot="icon">
				<Button fab icon text size="small" on:click="{() => history.back()}">
					<Icon path="{mdiChevronLeft}" />
				</Button>
			</span> -->
			<span slot="title">{title}</span>
		</AppBar>
		<main>
			<List>
				{#if delivery}
					<Badge class="primary-color" dot>
						<Card>
							<ListItem
								on:click="{() => goto(`/courier/delivery/${delivery?.id}`)}"
							>
								<span slot="prepend">
									<Icon path="{mdiCubeOutline}" />
								</span>
								<span>{delivery.sender.name}</span>
								<span slot="subtitle">{delivery.sender.place}</span>
							</ListItem>
						</Card>
					</Badge>
				{/if}
			</List>
		</main>
		<Footer class="white elevation-5">
			<nav class="nav">
				<ul>
					{#each navigation as item}
						<li>
							<Button text fab>
								<a
									class="{path == item.link
										? 'primary-text'
										: 'grey-text text-darken-3'}"
									href="{item.link}"
									><Icon path="{item.icon}" />
									<div>{item.name}</div></a
								>
							</Button>
						</li>
					{/each}
				</ul>
			</nav>
		</Footer>
		<UserUnauthDialog
			bind:active="{showUserUnauthDialog}"
			basepath="/courier"
		/>
		<InitDialog bind:active="{showInitDialog}" />
	</MaterialAppMin>
</div>
