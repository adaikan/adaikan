<script context="module" lang="ts">
	import {
		MaterialAppMin,
		AppBar,
		Button,
		Icon,
		Footer,
		Card,
		NavigationDrawer,
		List,
		Divider,
		ListItem,
		Avatar,
		Badge,
	} from 'svelte-materialify/src';
	import {
		mdiHistory,
		mdiHomeOutline,
		mdiAccountOutline,
		mdiAccountCogOutline,
		mdiCubeOutline,
		mdiMessageTextOutline,
	} from '@mdi/js';
	import ProgressLinear from '$components/progress-linear.svelte';
	import UserUnauthDialog from '$components/user-unauth-dialog.svelte';
	import InitDialog from './_init-dialog.svelte';

	import * as Map from '$lib/map';

	import { getContext, onMount, onDestroy } from 'svelte';
	import { slide, fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	import type { ObserverUnsafe } from '$lib/helper';
	import type { CourierClientApi } from './__layout.svelte';
	import type { Service } from '../__layout.svelte';

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
	const service = getContext<Service>('service');
	const is_desktop = getContext<ObserverUnsafe<boolean>>('is_desktop');
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
	let pathname = $page.path;

	$: loading = loader?.active;

	onMount(init);
	onDestroy(release);
	async function init() {
		try {
			await client.ready;
			user = await client.courier.auth();
			if (!user.position.length) {
				showInitDialog = true;
			} else {
				const {coords: {longitude, latitude}} = await Map.getLocation();
				if (
					user.position[0] != longitude &&
					user.position[1] != latitude
				) {
					await Map.track([
						longitude,
						latitude,
					]);
					const selected = Map.getSelected();
					if (selected) {
						await client.courier.update({
							where: { id: user.id },
							data: {
								area: selected.area,
								local: selected.local,
								place: selected.place,
								address: Map.address.get(),
								position: [longitude, latitude],
							},
						});
					}
				}
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
			service.register('service-worker.js');
			service.subscribe({
				role: 'buyer',
				userId: user.id,
				nodeId: user.chatNodeId,
			});
		} catch (error: any) {
			console.error(error);
			switch (error.type) {
				case client.courier.api.Error.FailedAuthentication.type:
					showUserUnauthDialog = true;
					service.unregister();
					break;

				default:
					break;
			}
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
		flex-grow: 1;
	}
	.list {
		display: flex;
		gap: 16px;
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
		@include common-appbar($pad: false) {
			z-index: 2;
		}
		@include common-drawer;
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
		<AppBar class="primary-color {$loading ? 'top-4' : ''}">
			<span slot="title">{title}</span>
		</AppBar>
		{#if $is_desktop}
			<section transition:slide class="list">
				<NavigationDrawer active="{true}" fixed="{false}" index="{1}">
					<header class="header">
						<Avatar>
							{#if user?.image}
								<img
									class=""
									src="{user?.image}"
									alt="Profile"
									on:error="{() => {
										user.image = '';
										user = user;
									}}"
								/>
							{:else}
								<Icon
									class="grey-text text-darken-2"
									path="{mdiAccountOutline}"
								/>
							{/if}
						</Avatar>
						<div class="text">
							<h1 class="title">{user?.name}</h1>
							<h2 class="subtitle">{user?.place}</h2>
						</div>
					</header>
					<Divider />
					<List nav>
						{#each navigation as item}
							<a href="{item.link}">
								<ListItem active="{item.link == pathname}">
									<span slot="prepend">
										<Icon path="{item.icon}" />
									</span>
									{item.name}
								</ListItem>
							</a>
						{/each}
					</List>
				</NavigationDrawer>
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
				<section style="flex-grow: 1;"></section>
			</section>
		{:else}
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
		{/if}
		{#if !$is_desktop}
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
		{/if}
		<UserUnauthDialog
			bind:active="{showUserUnauthDialog}"
			basepath="/courier"
			role="courier"
		/>
		<InitDialog bind:active="{showInitDialog}" />
	</MaterialAppMin>
</div>
