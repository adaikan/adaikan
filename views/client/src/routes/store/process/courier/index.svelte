<script context="module" lang="ts">
	import {
		MaterialAppMin,
		AppBar,
		Footer,
		Button,
		Icon,
		Subheader,
		Menu,
		NavigationDrawer,
		Avatar,
		List,
		ListGroup,
		ListItem,
		ListItemGroup,
		Tooltip,
		Card,
		Chip,
		TextField,
		Textarea,
		Checkbox,
	} from 'svelte-materialify/src';
	import * as Map from '$lib/map';
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
		mdiMapMarkerAlertOutline,
		mdiMagnify,
		mdiClose,
		mdiMapMarker,
		mdiMapSearchOutline,
		mdiCrosshairsGps,
		mdiImageBrokenVariant,
		mdiStorefrontOutline,
		mdiStorefront,
		mdiMotorbike,
		mdiInformationOutline,
		mdiAccountDetailsOutline,
		mdiImageRemove,
	} from '@mdi/js';
	import ProgressLinear from '$components/progress-linear.svelte';
	import NoStore from '../../_no-store-.svelte';
	import Snackbar from '$components/snackbar.svelte';
	import RequestLocationPermissionDialog from '$components/ask-location-dialog.svelte';

	import { onMount, onDestroy, getContext } from 'svelte';
	import { derived, writable } from 'svelte/store';
	import { fade, slide } from 'svelte/transition';
	import { browser, dev } from '$app/env';
	import { goto } from '$app/navigation';
	import { assets } from '$app/paths';
	import { CourierClientApi } from '$lib/courier';

	import type { Item, MapComponent } from '$lib/map';
	import type { SellerClientApi } from '../../__layout.svelte';

	const title = 'Cari Kurir';
</script>

<script lang="ts">
	import { page, navigating, session } from '$app/stores';

	let sellerClient = getContext<SellerClientApi>('seller');
	let client = new CourierClientApi(sellerClient.options);
	let user: SellerClientApi.Seller;
	let store: SellerClientApi.Store;
	let selected: CourierClientApi.Courier | undefined;
	let couriers: CourierClientApi.Courier[] = [];
	let map: MapComponent;
	let requestLocationPermissionDialog: RequestLocationPermissionDialog;
	let isLoading = writable(true);
	let disableSubmit = true;
	let loader: ProgressLinear;
	let snackbar: Snackbar;
	let noStore: NoStore;

	$: isLoading = loader?.active;
	$: {
		if ($navigating) {
			loader.loading();
		}
	}
	$: {
		if (selected) {
			disableSubmit = false;
		} else {
			disableSubmit = true;
		}
	}
	$: map?.resize();

	onMount(init);
	onDestroy(release);
	async function init() {
		try {
			client.init();
			await sellerClient.ready;

			user = await sellerClient.seller.auth();

			couriers = await client.courier.searchMany({
				where: {
					AND: [
						{ contracted: false },
						{ address: { not: null } },
					],
				},
			});

			if (user.storeId) {
				store = await sellerClient.store.search({
					where: { id: user.storeId },
					rejectOnNotFound: true,
				});
			}
		} catch (error: any) {
		} finally {
			loader.loaded();
		}
	}
	async function release() {}
	function flyTo(center: any) {
		map.flyTo({ center, zoom: 17 });
	}
	async function submit() {
		try {
			loader.loading();
			if (!selected) {
				throw new Error('Kurir tidak ada');
			}
			const { order } = $session;
			if (order) {
				$session = { courier: selected.id };
				goto('/store/process/' + order, { replaceState: true });
			} else {
				throw new Error("Referensi tidak ada");
			}
		} catch (error: any) {
		} finally {
			loader.loaded();
		}
	}
	// async function download(url: string) {
	// 	return URL.createObjectURL(await client.courier.downloadImage(url));
	// }
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="" content="" />
</svelte:head>

<div transition:slide>
	<MaterialAppMin>
		<ProgressLinear bind:this="{loader}" />
		<AppBar class="primary-color {$isLoading ? 'top-4' : ''}">
			<span slot="icon">
				<Button fab icon text size="small" on:click="{() => history.back()}">
					<Icon path="{mdiChevronLeft}" />
				</Button>
			</span>
			<span slot="title">{title}</span>
		</AppBar>
		<main>
			<form id="select-courier" on:submit|preventDefault="{submit}">
				{#if user}
					<div class="map">
						<Map.Map
							accessToken="{Map.MAP_KEY}"
							style="mapbox://styles/mapbox/streets-v11"
							bind:this="{map}"
							zoom="{Map.zoom}"
							center="{Map.center}">
							{#each couriers as courier}
								<Map.Marker
									popup="{false}"
									lng="{courier.position[0]}"
									lat="{courier.position[1]}"
									label="{courier.name}"
									color="#42A5F5">
									<Tooltip top>
										<div class="pin">
											<Icon
												path="{mdiMotorbike}"
												size="{48}"
												class="primary-text" />
										</div>
										<span slot="tip">{courier.name}</span>
									</Tooltip>
								</Map.Marker>
							{/each}
							{#if store}
								<Map.Marker
									popup="{false}"
									lng="{store.position[0]}"
									lat="{store.position[1]}"
									label="{store.name}">
									<Tooltip top>
										<div class="pin">
											<Icon
												path="{mdiStorefrontOutline}"
												size="{48}"
												class="primary-text" />
										</div>
										<span slot="tip">{store.name}</span>
									</Tooltip>
								</Map.Marker>
							{/if}
							<Map.NavigationControl />
							<Map.GeolocateControl />
							<Map.ScaleControl />
						</Map.Map>
					</div>
					<List>
						<Subheader>Daftar Kurir</Subheader>
						{#each couriers as courier}
							<ListItem
								multiline
								value="{courier.address}"
								active="{courier.address == selected?.address}"
								on:click="{() => {
									selected = courier;
									flyTo(courier.position);
								}}">
								<Avatar slot="prepend">
									{#if courier.image}
										<img
											class="thumb"
											src="{courier.image}"
											alt="{courier.name ?? ''}"
											on:error="{() => {
												courier.image = '';
												courier = courier;
											}}" />
									{:else}
										<div class="thumb e">
											<Icon path="{mdiImageRemove}" />
										</div>
									{/if}
								</Avatar>
								<div>{courier.name}</div>
								<div class="mult" slot="subtitle">{courier.address}</div>
								<Button
									fab
									icon
									text
									size="small"
									slot="append"
									on:click="{() =>
										goto('/store/process/courier/' + courier.id)}">
									<Icon
										class="grey-text text-darken-3"
										path="{mdiAccountDetailsOutline}" />
								</Button>
							</ListItem>
						{/each}
					</List>
				{:else}
					<div class="map loading">&nbsp;</div>
					<input type="text" class="loading" />
					<input type="text" class="loading" />
					<input type="text" class="loading" />
				{/if}
			</form>
		</main>
		<Footer class="white elevation-5">
			<section class="btn">
				<Button
					class="{disableSubmit ? '' : 'primary-color'}"
					form="select-courier"
					type="submit"
					disabled="{disableSubmit}">Pilih</Button>
			</section>
		</Footer>
		<RequestLocationPermissionDialog
			bind:this="{requestLocationPermissionDialog}" />
		<Snackbar bind:this="{snackbar}" />
		<NoStore bind:this="{noStore}" />
	</MaterialAppMin>
</div>

<style lang="scss">
	@import '../../../../components/common';
	@import '../../../../components/skeleton';
	.loading {
		@include loading-sekeleton;
	}
	main {
		padding: 16px 0;
		display: grid;
		align-content: start;
		row-gap: 16px;
		@include main;
	}
	form {
		display: grid;
		row-gap: 16px;
		grid-template-rows: 60vh 1fr;
	}
	input {
		margin: 0 16px;
		width: stretch;
		min-height: 44px;
	}
	.thumb {
		object-fit: contain;
		object-position: center;
		width: 100%;
		aspect-ratio: 1;
		border-radius: 50%;
		&.e {
			display: grid;
			place-items: center;
		}
	}
	.map {
		position: relative;
		display: grid;
		place-items: center;
		width: 100%;
		z-index: 0;
	}
	.mult {
		margin-top: 4px;
		display: grid;
		row-gap: 4px;
	}
	.btn {
		padding: 0 16px;
		width: stretch;
		display: grid;
		column-gap: 16px;
	}
	* :global {
		@include common-app;
		@include common-loader;
		@include common-appbar;
		@include common-footer;
		.pin {
			transform: translate(0px, -22.5px);
		}
		.s-list-item {
			display: flex;
			column-gap: 24px;
		}
	}
</style>
