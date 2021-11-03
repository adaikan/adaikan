<script context="module" lang="ts">
	import {
		MaterialAppMin,
		AppBar,
		Button,
		Icon,
		TextField,
		Textarea,
		Select,
		Radio,
		Footer,
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
	import ProgressLinear from '$components/progress-linear.svelte';
	import Alert from '$components/alert.svelte';
	import RequestLocationPermissionDialog from '$components/ask-location-dialog.svelte';
	import {
		Map,
		MapComponent,
		GeolocateControl,
		NavigationControl,
		ScaleControl,
		Marker,
		askLocationPermission,
		getLocation,
		CONST,
		recenter,
		moving,
		geolocating,
		address,
		tracking,
		searching,
		typing,
		menuList,
		getSelected,
		lng,
		lat,
		centre,
	} from '$lib/map';
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
		mdiImagePlus,
		mdiMapMarker,
	} from '@mdi/js';
	import { mdiClipboardTextClockOutline } from '$lib/icons';

	import { onMount, onDestroy, getContext } from 'svelte';
	import { fade, slide, scale } from 'svelte/transition';
	import { writable, derived } from 'svelte/store';
	import { dev, browser } from '$app/env';
	import { goto } from '$app/navigation';
	import { wait } from '$lib/helper';
	import { MAP_KEY } from '$lib/env';

	import type { Item } from '$lib/map';
	import type { SellerClientApi } from './__layout.svelte';

	const title = 'Buat Toko';
</script>

<script lang="ts">
	let client = getContext<SellerClientApi>('seller');
	let user: SellerClientApi.Seller;
	let loader: ProgressLinear;
	let alert: Alert;
	let map: MapComponent;
	let requestLocationPermissionDialog: RequestLocationPermissionDialog;
	let isLoading = false;
	let position: GeolocationPosition | undefined;
	let file: File | undefined;

	let imageUrl = '';
	let name = '';
	let telp = '';
	let myAddress = '';
	let disableSubmit = true;
	let menuActive = false;
	let addressList: Item[] = [];

	$: {
		if (myAddress) {
			typing(myAddress);
		}
	}

	$: {
		if (myAddress && imageUrl && name) {
			disableSubmit = false;
		} else {
			disableSubmit = true;
		}
	}

	onMount(init);
	onDestroy(release);

	async function init() {
		try {
			const permission = await askLocationPermission();

			await client.ready;
			user = await client.seller.auth();

			if (user.storeId) {
				return goto('/store', { replaceState: true });
			}

			loader.active.subscribe((value) => (isLoading = value));

			address.subscribe(updateMyAddress);
			menuList.subscribe(updateAddressList);
			searching.subscribe(onSearchingOrTracking);
			tracking.subscribe(onSearchingOrTracking);

			if (permission != 'granted') {
				requestLocationPermissionDialog.state.subscribe(async (value) => {
					if (value == 'granted') {
						position = await getLocation();
						flyTo([position.coords.longitude, position.coords.latitude]);
					}
				});
				requestLocationPermissionDialog.active.set(true);
			} else {
				position = await getLocation();
				flyTo([position.coords.longitude, position.coords.latitude]);
			}
		} catch (error: any) {
		} finally {
			loader.loaded();
		}
	}
	function release() {
		address?.unsubscribe(updateMyAddress);
		menuList?.unsubscribe(updateAddressList);
		searching?.unsubscribe(onSearchingOrTracking);
		tracking?.unsubscribe(onSearchingOrTracking);
	}
	async function create() {
		try {
			loader.loading();
			alert.hide();
			const address = getSelected();
			if (!file) {
				throw new Error('Foto tidak ada');
			}
			if (!address) {
				throw new Error('Lokasi tidak dijangkau');
			}
			disableSubmit = true;
			let path = await client.store.uploadImage(
				`${user.id}/${file.name}`,
				file
			);
			await client.store.create({
				data: {
					name,
					telp,
					image: path,
					address: address.value,
					area: address.area,
					local: address.local,
					place: address.place,
					position: centre.get(),
					seller: { connect: { id: user.id } },
					chatNode: {
						create: { role: 'seller', name, image: path, type: 'PerToPer' },
					},
				},
			});
			alert.setText('Berhasil');
			alert.setState('success');
			setTimeout(() => {
				goto('/store', { replaceState: true });
			}, 1000);
		} catch (error: any) {
			alert.setText(error.message);
			alert.setState('error');
			disableSubmit = false;
		} finally {
			alert.show();
			loader.loaded();
		}
	}
	function updateMyAddress(value: string) {
		myAddress = value;
	}
	function updateAddressList(value: Item[]) {
		addressList = value;
	}
	function onSearchingOrTracking(value: boolean) {
		if (value) {
			loader.loading();
		} else {
			loader.loaded();
		}
	}
	function flyTo(center: [number, number]) {
		map.flyTo({
			center: [center[0], center[1]],
			zoom: 16,
		});
	}
	function inputFile(
		event: Event & {
			currentTarget: EventTarget & HTMLInputElement;
		}
	) {
		file = event.currentTarget.files?.[0];
		if (file) {
			imageUrl = URL.createObjectURL(file);
		}
	}
</script>

<style lang="scss">
	@import '../../components/common';
	@import '../../components/skeleton';
	.loading {
		@include loading-sekeleton();
	}
	main {
		padding: 32px 16px;
		@include main;
	}
	form {
		position: relative;
		display: grid;
		row-gap: 16px;
	}
	.thumb-wrapper {
		position: relative;
		display: grid;
		place-items: center;
		height: 250px;
		input {
			position: absolute;
			top: 0;
			opacity: 0;
		}
	}
	.thumb {
		margin: auto;
		height: inherit;
		width: env(height);
		object-fit: cover;
		object-position: center;
		aspect-ratio: 1/1;
	}
	.map {
		position: relative;
		display: grid;
		place-items: center;
		width: 100%;
		aspect-ratio: 1/1.5;
		z-index: 0;
	}
	.pin {
		position: absolute;
		transform: translate(0px, -22.5px);
		z-index: 5;
	}

	* :global {
		@include common-app;
		@include common-loader;
		@include common-appbar;
		.s-text-field__input input {
			line-height: normal;
		}
		.s-textarea .s-text-field__wrapper.outlined textarea {
			margin-top: 8px;
		}
		.s-menu {
			width: 100%;
		}
		.mapboxgl-ctrl-geocoder--input {
			font-size: 16px !important;
		}
	}
</style>

<svelte:head>
	<title>{title}</title>
	<meta name="" content="" />
</svelte:head>

<div transition:fade>
	<MaterialAppMin>
		<ProgressLinear bind:this="{loader}" />
		<AppBar class="primary-color {isLoading ? 'top-4' : ''}">
			<div slot="icon">
				<Button
					text
					fab
					size="small"
					depressed
					on:click="{() => history.back()}"
				>
					<Icon path="{mdiChevronLeft}" />
				</Button>
			</div>
			<div slot="title">{title}</div>
		</AppBar>
		<main>
			<form on:submit|preventDefault="{create}">
				<Alert bind:this="{alert}" />
				<label class="thumb-wrapper">
					<input type="file" accept="image/*" capture on:input="{inputFile}" />
					{#if imageUrl}
						<img class="thumb" src="{imageUrl}" alt="" />
					{:else}
						<Icon size="{56}" path="{mdiImagePlus}" />
					{/if}
				</label>
				<TextField autocomplete="text" outlined bind:value="{name}"
					>Nama Toko</TextField
				>
				{#if browser}
					<div class="map">
						<div class="pin">
							<Icon path="{mdiMapMarker}" size="{48}" class="primary-text" />
						</div>
						<Map
							accessToken="{MAP_KEY}"
							style="mapbox://styles/mapbox/streets-v11"
							bind:this="{map}"
							zoom="{CONST.zoom}"
							center="{CONST.center}"
							on:drag="{moving}"
							on:recentre="{recenter}"
						>
							<NavigationControl />
							<GeolocateControl on:geolocate="{geolocating}" />
							<ScaleControl />
						</Map>
					</div>
				{:else}
					<div class="map loading"></div>
				{/if}
				<Menu offsetY bind:active="{menuActive}" closeOnClick>
					<span slot="activator">
						<Textarea
							autogrow
							rows="{3}"
							outlined
							autocomplete="address"
							bind:value="{myAddress}"
							clearable>Alamat</Textarea
						>
					</span>
					<ListItemGroup bind:value="{myAddress}">
						{#each addressList as item}
							<ListItem
								value="{item.value}"
								active="{item.value == myAddress}"
								on:click="{() => {
									flyTo([item.center[0], item.center[1]]);
								}}"
							>
								{item.name}
							</ListItem>
						{/each}
					</ListItemGroup>
				</Menu>
				<Button
					class="{disableSubmit ? '' : 'primary-color'}"
					disabled="{disableSubmit}"
					type="submit">Buat</Button
				>
			</form>
		</main>
		<RequestLocationPermissionDialog
			bind:this="{requestLocationPermissionDialog}"
		/>
	</MaterialAppMin>
</div>
