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
	import { page, navigating, session } from '$app/stores';
	import { CourierClientApi } from '$lib/courier';

	import type { Item, MapComponent } from '$lib/map';
	import type { SellerClientApi } from '../../__layout.svelte';

	const title = 'Kurir';
</script>

<script lang="ts">
	let sellerClient = getContext<SellerClientApi>('seller');
	let courierClient = new CourierClientApi(sellerClient.options);
	let user: SellerClientApi.Data.Seller;
	let courier: CourierClientApi.Courier;
	let isLoading = writable(true);
	let loader: ProgressLinear;
	let snackbar: Snackbar;
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
			courierClient.init();
			await sellerClient.ready;
			user = await sellerClient.seller.auth();
			courier = await courierClient.courier.search({
				where: { id: +$page.params.id },
				rejectOnNotFound: true,
			});
		} catch (error: any) {
		} finally {
			loader.loaded();
		}
	}
	async function release() {}
	async function submit() {
		try {
			loader.loading();
		} catch (error: any) {
		} finally {
			loader.loaded();
		}
	}
	async function download(url: string) {
		return URL.createObjectURL(await courierClient.courier.downloadImage(url));
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
			<span slot="icon">
				<Button fab icon text size="small" on:click="{() => history.back()}">
					<Icon path="{mdiChevronLeft}" />
				</Button>
			</span>
			<span slot="title">{title}</span>
			<span class="space"></span>
		</AppBar>
		<main>
			{#if courier}
				<form id="user" on:submit|preventDefault="{submit}">
					<Card tile>
						<div class="thumb-wrapper">
							{#if courier.image}
								{#await download(courier.image)}
									<div class="thumb loading"></div>
								{:then src}
									<img class="thumb" src="{src}" alt="{courier.name ?? ''}" />
								{:catch error}
									<div class="thumb e">
										<Icon path="{mdiImageBrokenVariant}" />
									</div>
								{/await}
							{:else}
								<div class="thumb loading"></div>
							{/if}
						</div>
					</Card>
					<br>
					<TextField outlined value="{courier.username}" readonly
						>Username</TextField>
					<TextField
						outlined
						value="{courier.email}"
						type="email"
						autocomplete="email"
						readonly>
						Email</TextField>
					<TextField
						outlined
						value="{courier.name ?? ''}"
						placeholder="-"
						autocomplete="name"
						readonly>Nama</TextField>
					<TextField
						outlined
						value="{courier.telp ?? ''}"
						placeholder="-"
						type="tel"
						autocomplete="tel-local"
						readonly>Nomor Handphone</TextField>
					<Textarea
						autogrow
						rows="{3}"
						outlined
						value="{courier.address ?? ''}"
						placeholder="-"
						readonly>
						Alamat
					</Textarea>
				</form>
			{:else}
				<form>
					<div class="thumb-wrapper">
						<div class="thumb loading"></div>
					</div>
					<div class="textfield loading"></div>
					<div class="textfield loading"></div>
					<div class="textfield loading"></div>
					<div class="textfield loading"></div>
					<div class="textfield loading"></div>
				</form>
			{/if}
		</main>
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
		padding: 24px 0;
		display: grid;
		align-content: start;
		row-gap: 16px;
	}
	form {
		display: grid;
		row-gap: 16px;
	}
	.thumb-wrapper {
		padding: 16px;
		position: relative;
		display: grid;
		place-items: center;
		min-height: 150px;
		input {
			position: absolute;
			top: 0;
			opacity: 0;
		}
	}
	.thumb {
		margin: auto;
		height: 150px;
		width: env(height);
		object-fit: cover;
		object-position: center;
		aspect-ratio: 1/1;
		&.e {
			display: grid;
			place-items: center;
		}
	}
	.textfield {
		margin: 0 16px;
		min-height: 44px;
	}
	* :global {
		@include common-app;
		@include common-loader;
		@include common-appbar;
		.s-text-field,
		.s-textarea {
			padding: 0 16px;
		}
	}
</style>
