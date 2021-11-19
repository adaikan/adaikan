<script context="module" lang="ts">
	import {
		MaterialAppMin,
		AppBar,
		Button,
		Icon,
		TextField,
		Textarea,
		Select,
		ListItem,
		List,
		Dialog,
	} from 'svelte-materialify/src';
	import {
		mdiChevronLeft,
		mdiImagePlus,
		mdiCameraOutline,
		mdiImageOutline,
	} from '@mdi/js';
	import ProgressLinear from '$components/progress-linear.svelte';
	import Snackbar from '$components/snackbar.svelte';

	import { onMount, onDestroy, getContext } from 'svelte';
	import { fade, slide, scale } from 'svelte/transition';
	import { writable, derived } from 'svelte/store';
	import { dev } from '$app/env';
	import { goto } from '$app/navigation';
	import { page, navigating } from '$app/stores';
	import { Currency, element_support } from '$lib/helper';

	import type { SellerClientApi } from '../__layout.svelte';

	const title = 'Tambah Ikan';
	const weightUnits = [{ name: 'Kg', value: 'Kg' }];
</script>

<script lang="ts">
	const client = getContext<SellerClientApi>('seller');
	let seller: SellerClientApi.Seller;
	let store: SellerClientApi.Store;
	let loader: ProgressLinear;
	let snackbar: Snackbar;
	let loading = false;
	let file: File | undefined;
	let name = '';
	let description = '';
	let image = '';
	let price = '';
	let stock = '';
	let weight = '';
	let fresh = true;
	let priceUnit = 'Rp';
	let weightUnit = 'Kg';

	let show_pick_image = false;
	let support_image_capture = false;
	let imageUrl = '';
	$: {
		if (navigating && $navigating) {
			loader.loading();
		}
	}
	onMount(init);
	onDestroy(release);
	async function init() {
		try {
			await client.ready;
			seller = await client.seller.auth();
			if (!seller.storeId) {
				throw new Error('Toko belum ada');
			}
			store = await client.store.search({
				where: { id: seller.storeId },
				rejectOnNotFound: true,
			});
			loader.active.subscribe((value) => (loading = value));
			support_image_capture = element_support('input', 'capture');
		} catch (error: any) {
		} finally {
			loader.loaded();
		}
	}
	function release() {}
	async function submit() {
		try {
			loader.loading();
			if (!file) {
				throw new Error('Foto tidak ada');
			}
			image = await client.product.uploadImage(
				`${store.id}/${name}/${file.name}`,
				file
			);
			await client.product.create({
				data: {
					name,
					description,
					image,
					price: Currency.toNumber(price),
					stock: +stock,
					weight: +weight,
					weightUnit,
					fresh,
					storeId: store.id,
				},
			});
			snackbar.setText('Berhasil menambah');
			setTimeout(() => {
				goto('/store/products', { replaceState: true });
			}, 1500);
		} catch (error: any) {
			snackbar.setText(error.message);
		} finally {
			snackbar.show();
			loader.loaded();
		}
	}
	function onInput(event: Event) {
		event.preventDefault();
		price = Currency.toMoney(price);
	}
	function inputFile(
		event: Event & {
			currentTarget: EventTarget & HTMLInputElement;
		}
	) {
		file = event.currentTarget.files?.[0];
		if (file) {
			show_pick_image = false;
			image = imageUrl = URL.createObjectURL(file);
		}
	}
</script>

<style lang="scss">
	@import '../../../components/common';
	main {
		padding: 16px;
		@include main;
	}
	form {
		display: grid;
		row-gap: 32px;
		align-content: start;
	}
	fieldset {
		display: grid;
		row-gap: 16px;
		border: none;
	}
	.sub {
		display: flex;
		column-gap: 4px;
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
		border-radius: 6px;
	}
	* :global {
		@include common-app;
		@include common-loader;
		@include common-appbar;
		.textfield {
			.s-text-field__input {
				input {
					max-height: 36px;
					padding-bottom: 6px;
					line-height: 34px;
				}
			}
			.s-list-item__title,
			.s-list-item__subtitle {
				line-height: 1.5;
			}
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
		<AppBar class="primary-color {loading ? 'top-4' : ''}">
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
			<form on:submit|preventDefault="{submit}">
				<fieldset>
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
				</fieldset>
				<fieldset>
					<TextField class="textfield" bind:value="{name}" required>
						Nama Ikan*
					</TextField>
					<Textarea autogrow rows="{1}" bind:value="{description}">
						Deskripsi Produk
					</Textarea>
					<TextField
						class="textfield"
						type="number"
						bind:value="{price}"
						on:input="{onInput}"
						required
					>
						Harga*
					</TextField>
					<TextField
						class="textfield"
						type="number"
						bind:value="{stock}"
						required
					>
						Jumlah/Ekor*
					</TextField>
					<div class="sub">
						<TextField class="textfield" type="number" bind:value="{weight}">
							Berat
						</TextField>
						<Select
							class="textfield"
							items="{weightUnits}"
							bind:value="{weightUnit}"
						>
							Satuan
						</Select>
					</div>
				</fieldset>
				<fieldset>
					<Button block class="primary-color" type="submit"
						>Tambah Produk</Button
					>
				</fieldset>
			</form>
		</main>
		<Snackbar bind:this="{snackbar}" />
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
