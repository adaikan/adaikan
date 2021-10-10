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
		mdiPencilOutline,
		mdiMapMarker,
	} from '@mdi/js';
	import { mdiClipboardTextClockOutline } from '$lib/icons';

	import { onMount, onDestroy, getContext } from 'svelte';
	import { fade, slide, scale } from 'svelte/transition';
	import { writable, derived } from 'svelte/store';
	import { dev, browser } from '$app/env';
	import { goto } from '$app/navigation';
	import { Diff, unsafeDuplicate, wait } from '$lib/helper';
	import { MAP_KEY } from '$lib/env';

	import type { Item } from '$lib/map';
	import type { SellerClientApi } from '../__layout.svelte';

	const title = 'Toko';
</script>

<script lang="ts">
	let client = getContext<SellerClientApi>('seller');
	let user: SellerClientApi.Data.Seller;
	let store: SellerClientApi.Data.Store;
	let cache: any;
	let loader: ProgressLinear;
	let alert: Alert;
	let isLoading = false;
	let imageUrl = '';
	let file: File | undefined;
	let disableSubmit = true;

	$: imageUrl = store?.image;
	$: {
		if (store) {
			const changed = Diff.object(cache, store);
			if (changed) {
				disableSubmit = false;
			} else {
				disableSubmit = true;
			}
		}
	}

	onMount(init);
	onDestroy(release);

	async function init() {
		try {
			loader.active.subscribe((value) => (isLoading = value));

			await client.ready;
			user = await client.seller.auth();

			if (!user.storeId) {
				return goto('/store', { replaceState: true });
			}

			store = await client.store.search({
				where: { id: user.storeId },
				rejectOnNotFound: true,
			});
			cache = unsafeDuplicate(store);
		} catch (error: any) {
			alert.setState('error');
			alert.setText(error.message);
			alert.show();
		} finally {
			loader.loaded();
		}
	}
	function release() {}
	async function create() {
		try {
			loader.loading();
			alert.hide();
			disableSubmit = true;

			const changed = Diff.object(cache, store);

			if (!changed) {
				throw new Error('Tidak ada berubah');
			}
			if (file) {
				changed.image = await client.store.uploadImage(
					`/${user.id}/${file.name}`,
					file
				);
			}

			await client.store.update({ where: { id: store.id }, data: changed });

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
	function inputFile(
		event: Event & {
			currentTarget: EventTarget & HTMLInputElement;
		}
	) {
		file = event.currentTarget.files?.[0];
		if (file) {
			imageUrl = URL.createObjectURL(file);
			store.image = imageUrl;
			store = store;
		}
	}
</script>

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
					on:click="{() => history.back()}">
					<Icon path="{mdiChevronLeft}" />
				</Button>
			</div>
			<div slot="title">{title}</div>
		</AppBar>
		<main>
			<form on:submit|preventDefault="{create}">
				<Alert bind:this="{alert}" />
				{#if store}
					<label class="thumb-wrapper">
						<input
							type="file"
							accept="image/*"
							capture
							on:input="{inputFile}" />
						{#if imageUrl}
							<img class="thumb" src="{imageUrl}" alt="" />
						{:else}
							<Icon size="{56}" path="{mdiImagePlus}" />
						{/if}
					</label>
					<TextField autocomplete="text" outlined bind:value="{store.name}"
						>Nama Toko</TextField>
					<TextField autocomplete="tel" outlined bind:value="{store.telp}"
						>Nomor Handphone</TextField>
					<Textarea
						autogrow
						rows="{3}"
						outlined
						value="{store.address}"
						readonly>
						<div>Alamat</div>
						<div slot="append">
							<Button
								fab
								icon
								text
								size="small"
								on:click="{() => {
									loader.loading();
									sessionStorage.setItem('store', JSON.stringify(store));
									goto('/store/detail/pin');
								}}">
								<Icon
									class="grey-text text-darken-3"
									path="{mdiPencilOutline}" />
							</Button>
						</div>
					</Textarea>
				{:else}
					<div class="thumb-wrapper">
						<div class="thumb loading">&nbsp;</div>
					</div>
					<div class="textfield loading">&nbsp;</div>
					<div class="textfield loading">&nbsp;</div>
				{/if}
				<Button
					class="{disableSubmit ? '' : 'primary-color'}"
					disabled="{disableSubmit}"
					type="submit">Perbarui</Button>
			</form>
		</main>
	</MaterialAppMin>
</div>

<style lang="scss">
	@import '../../../components/common';
	@import '../../../components/skeleton';
	.loading {
		@include loading-sekeleton();
	}
	main {
		padding: 24px 16px;
		@include main;
	}
	form {
		position: relative;
		display: grid;
		row-gap: 24px;
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
	.textfield {
		height: 48px;
	}

	* :global {
		@include common-app;
		@include common-appbar;
		@include common-loader;
		.s-text-field__input input {
			line-height: normal;
		}
		.s-textarea .s-text-field__wrapper.outlined textarea {
			margin-top: 8px;
		}
	}
</style>
