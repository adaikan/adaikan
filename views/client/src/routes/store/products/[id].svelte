<script context="module" lang="ts">
	import {
		MaterialAppMin,
		AppBar,
		Button,
		Icon,
		TextField,
		Textarea,
		Select,
		List,
		ListItem,
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
	import { fade } from 'svelte/transition';
	import { Diff, Currency, element_support } from '$lib/helper';

	import type { SellerClientApi } from '../__layout.svelte';

	const title = 'Tambah Ikan';
	const weightUnits = [{ name: 'Kg', value: 'Kg' }];
	const options = [
		{ name: 'Ya', value: 1 },
		{ name: 'Tidak', value: 2 },
	];
</script>

<script lang="ts">
	import { page, navigating } from '$app/stores';

	const client = getContext<SellerClientApi>('seller');
	let seller: SellerClientApi.Seller;
	let store: SellerClientApi.Store;
	let product: SellerClientApi.Product;
	let copy: Partial<SellerClientApi.Product>;
	let loader: ProgressLinear;
	let snackbar: Snackbar;
	let loading = false;
	let file: File | undefined;
	let imageUrl = '';
	let price = '';
	let disableSubmit = true;

	let show_pick_image = false;
	let support_image_capture = false;

	$: {
		if (navigating && $navigating) {
			loader.loading();
		}
	}
	$: {
		if (copy) {
			const changed = Diff.object(copy, product);
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
		loader.active.subscribe((value) => (loading = value));
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
			product = await client.product.search({
				where: { id: +$page.params.id },
				rejectOnNotFound: true,
			});
			convert(product);
			copy = Diff.objectCopy(product);
			imageUrl = store.image;
			support_image_capture = element_support('input', 'capture');
		} catch (error: any) {
			snackbar.setText(error.message);
			snackbar.show();
		} finally {
			loader.loaded();
		}
	}
	function release() {}
	async function update() {
		try {
			loader.loading();
			disableSubmit = true;
			const changed = Diff.object(copy, product);
			if (!changed) {
				throw new Error('Tidak ada perubahan');
			}
			if (file) {
				changed.image = await client.product.uploadImage(
					`${store.id}/${changed.name ?? product.name}/${file.name}`,
					file
				);
			}
			convert(changed, true);
			await client.product.update({
				where: { id: +$page.params.id },
				data: changed,
			});
			convert(changed);
			Diff.objectAssign(copy, changed);
			snackbar.setText('Berhasil perbarui');
		} catch (error: any) {
			snackbar.setText(error.message);
			disableSubmit = false;
		} finally {
			snackbar.show();
			loader.loaded();
		}
	}
	async function del() {
		try {
			loader.loading();
			imageUrl = '';
			await client.product.delete({ where: { id: +$page.params.id } });
			snackbar.setText('Berhasil hapus');
		} catch (error: any) {
			snackbar.setText(error.message);
		} finally {
			snackbar.show();
			loader.loaded();
		}
	}
	function convert(data: Partial<SellerClientApi.Product>, reverse = false) {
		if (reverse) {
			if (data.price) {
				data.price = Currency.toNumber(data.price as any) as any;
			}
			if (data.stock) {
				data.stock = +data.stock;
			}
			if (data.weight) {
				data.weight = +data.weight;
			}
			if (data.forSale) {
				if (data.forSale == (1 as any)) {
					data.forSale = true;
				} else {
					data.forSale = false;
				}
			}
			if (data.fresh) {
				if (data.fresh == (1 as any)) {
					data.fresh = true;
				} else {
					data.fresh = false;
				}
			}
		} else {
			if (data.price) {
				data.price = Currency.toMoney(data.price as any) as any;
			}
			if (data.forSale) {
				data.forSale = 1 as any;
			} else {
				data.forSale = 2 as any;
			}
			if (data.fresh) {
				data.fresh = 1 as any;
			} else {
				data.fresh = 2 as any;
			}
		}
	}
	function onInput(event: Event) {
		event.preventDefault();
		product.price = Currency.toMoney(product.price as any) as any;
	}
	function inputFile(
		event: Event & {
			currentTarget: EventTarget & HTMLInputElement;
		}
	) {
		file = event.currentTarget.files?.[0];
		if (file) {
			show_pick_image = false;
			product.image = imageUrl = URL.createObjectURL(file);
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
		display: grid;
		grid-auto-flow: column;
		column-gap: 16px;
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
	.radio {
		display: grid;
		row-gap: 8px;
		.label {
			font-size: 13px;
		}
		.group {
			display: grid;
			row-gap: 4px;
		}
	}
	.btn {
		width: stretch;
		height: stretch;
		display: grid;
		place-content: center;
		grid-template-columns: 1fr 1fr;
		column-gap: 8px;
	}
	* :global {
		@include common-app;
		@include common-appbar;
		@include common-loader;
		.textfield {
			&.loading {
				height: 38px;
			}
			.s-input__slot {
				margin-top: 12px;
			}
			.s-text-field__input {
				input {
					padding: 0;
					max-height: 30px;
					line-height: 30px;
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
			<form on:submit|preventDefault="{update}">
				{#if product}
					<fieldset>
						<div class="thumb-wrapper">
							{#if imageUrl}
								<img class="thumb" src="{imageUrl}" alt="" />
							{:else}
								<Icon size="{56}" path="{mdiImagePlus}" />
							{/if}
							<button
								type="button"
								on:click="{() => (show_pick_image = !show_pick_image)}"
							></button>
						</div>
					</fieldset>
					<fieldset>
						<TextField class="textfield" bind:value="{product.name}" required>
							Nama Ikan*
						</TextField>
						<Textarea autogrow rows="{1}" bind:value="{product.description}">
							Deskripsi Produk
						</Textarea>
						<TextField
							class="textfield"
							type="number"
							step="0.1"
							bind:value="{product.price}"
							on:input="{onInput}"
							required
						>
							Harga*
						</TextField>
						<TextField
							class="textfield"
							type="number"
							bind:value="{product.stock}"
							required
						>
							Jumlah/Ekor*
						</TextField>
						<div class="sub">
							<TextField
								class="textfield"
								type="number"
								bind:value="{product.weight}"
							>
								Berat
							</TextField>
							<Select
								class="textfield"
								items="{weightUnits}"
								bind:value="{product.weightUnit}"
							>
								Satuan
							</Select>
						</div>
						<Select
							class="textfield"
							items="{options}"
							bind:value="{product.fresh}"
						>
							Segar
						</Select>
						<Select
							class="textfield"
							items="{options}"
							bind:value="{product.forSale}"
						>
							Dijual
						</Select>
					</fieldset>
					<fieldset class="btn">
						<Button
							type="submit"
							class="{disableSubmit ? '' : 'primary-color'}"
							disabled="{disableSubmit}">Perbarui</Button
						>
						<Button
							type="reset"
							class="error-color error-text"
							outlined
							on:click="{del}">Hapus</Button
						>
					</fieldset>
				{:else}
					<div class="thumb-wrapper">
						<div class="thumb loading">&nbsp;</div>
					</div>
					<div class="textfield loading">&nbsp;</div>
					<div class="textfield loading">&nbsp;</div>
					<div class="textfield loading">&nbsp;</div>
					<div class="textfield loading">&nbsp;</div>
					<div class="sub">
						<div class="textfield loading">&nbsp;</div>
						<div class="textfield loading">&nbsp;</div>
					</div>
					<div class="textfield loading">&nbsp;</div>
					<div class="textfield loading">&nbsp;</div>
				{/if}
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
