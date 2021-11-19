<script context="module" lang="ts">
	import {
		MaterialAppMin,
		AppBar,
		Button,
		Icon,
		TextField,
		Textarea,
		List,
		ListItem,
		Dialog,
	} from 'svelte-materialify/src';
	import ProgressLinear from '$components/progress-linear.svelte';
	import Alert from '$components/alert.svelte';
	import {
		mdiCameraOutline,
		mdiImageOutline,
		mdiChevronLeft,
		mdiImagePlus,
		mdiPencilOutline,
	} from '@mdi/js';

	import { onMount, onDestroy, getContext } from 'svelte';
	import { fade, slide, scale } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { Diff, unsafeDuplicate, element_support } from '$lib/helper';

	import type { SellerClientApi } from '../__layout.svelte';

	const title = 'Toko';
</script>

<script lang="ts">
	let client = getContext<SellerClientApi>('seller');
	let user: SellerClientApi.Seller;
	let store: SellerClientApi.Store;
	let cache: any;
	let loader: ProgressLinear;
	let alert: Alert;
	let isLoading = false;
	let imageUrl = '';
	let file: File | undefined;
	let disableSubmit = true;

	let show_pick_image = false;
	let support_image_capture = false;

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
			support_image_capture = element_support('input', 'capture');
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
			show_pick_image = false;
			imageUrl = URL.createObjectURL(file);
			store.image = imageUrl;
			store = store;
		}
	}
</script>

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
		button {
			position: absolute;
			top: 0;
			width: 100%;
			height: 100%;
			opacity: 0;
			z-index: 1;
		}
	}
	.input-file {
		position: absolute;
		top: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
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
				{#if store}
					<div class="thumb-wrapper">
						{#if imageUrl}
							<img class="thumb" src="{imageUrl}" alt="" />
						{:else}
							<Icon size="{56}" path="{mdiImagePlus}" />
						{/if}
						<button
							type="button"
							on:click="{() => (show_pick_image = !show_pick_image)}"></button>
					</div>
					<TextField autocomplete="text" outlined bind:value="{store.name}"
						>Nama Toko</TextField
					>
					<TextField autocomplete="tel" outlined bind:value="{store.telp}"
						>Nomor Handphone</TextField
					>
					<Textarea
						autogrow
						rows="{3}"
						outlined
						value="{store.address}"
						readonly
					>
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
								}}"
							>
								<Icon
									class="grey-text text-darken-3"
									path="{mdiPencilOutline}"
								/>
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
					type="submit">Perbarui</Button
				>
			</form>
		</main>
		<Dialog bind:active="{show_pick_image}">
			<List>
				<ListItem>
					<div>Pilih Gambar</div>
					<div slot="prepend">
						<Icon path="{mdiImageOutline}" />
					</div>
					<input
						class="input-file"
						type="file"
						accept="image/*"
						on:input="{inputFile}"
					/>
				</ListItem>
				{#if support_image_capture}
					<ListItem>
						<div>Ambil Foto</div>
						<div slot="prepend">
							<Icon path="{mdiCameraOutline}" />
						</div>
						<input
							class="input-file"
							type="file"
							accept="image/*"
							capture
							on:input="{inputFile}"
						/>
					</ListItem>
				{/if}
			</List>
		</Dialog>
	</MaterialAppMin>
</div>
