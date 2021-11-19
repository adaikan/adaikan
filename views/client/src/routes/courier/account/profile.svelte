<script context="module" lang="ts">
	import {
		MaterialAppMin,
		ProgressLinear,
		AppBar,
		Button,
		Icon,
		Card,
		List,
		ListItem,
		TextField,
		Textarea,
		Dialog,
	} from 'svelte-materialify/src';
	import {
		mdiMapOutline,
		mdiChevronLeft,
		mdiImagePlus,
		mdiCameraOutline,
		mdiImageOutline,
	} from '@mdi/js';
	import Snackbar from '$components/snackbar.svelte';
	import { onMount, onDestroy, getContext } from 'svelte';
	import { writable } from 'svelte/store';
	import { fade, slide } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { Diff, element_support } from '$lib/helper';
	import * as rules from '$lib/rules';
	import type { CourierClientApi } from '../__layout.svelte';
</script>

<script lang="ts">
	const client = getContext<CourierClientApi>('courier');
	const showProgress = writable(true);
	const progress = writable(0);
	const indeterminate = writable(true);
	let user: CourierClientApi.Courier;
	let copied: any;
	let imageUrl = '';
	let image: File | undefined;
	let snackbar: Snackbar;
	let disableSubmit = true;
	let show_pick_image = false;
	let support_image_capture = false;
	$: {
		if (copied) {
			const changed = Diff.object(copied, user);
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
			await client.ready;
			user = await client.courier.auth();
			copied = Diff.objectCopy(user);

			if (user.image) {
				imageUrl = user.image;
			}
			support_image_capture = element_support('input', 'capture');
		} catch (error: any) {
		} finally {
			$showProgress = false;
		}
	}
	async function release() {}
	async function submit() {
		try {
			$showProgress = true;
			disableSubmit = true;
			const changed = Diff.object(copied, user);
			if (!changed) {
				throw new Error('Tidak ada berubah');
			}
			if (changed.image && image) {
				changed.image = `${user.id}/${image.name}`;
				changed.image = await client.courier.uploadImage(changed.image, image);
			}
			await client.courier.update({
				where: { id: user.id },
				data: changed,
			});
			snackbar.setText('Berhasil perbarui');
			Diff.objectAssign(copied, changed);
		} catch (error: any) {
			snackbar.setText(error.message);
			disableSubmit = false;
		} finally {
			snackbar.show();
			$showProgress = false;
		}
	}
	function inputFile(
		event: Event & {
			currentTarget: EventTarget & HTMLInputElement;
		}
	) {
		const file = event.currentTarget.files?.[0];
		if (file && user) {
			show_pick_image = false;
			image = file;
			user.image = file.name;
			imageUrl = URL.createObjectURL(file);
		}
	}
</script>

<style lang="scss">
	@import '../../../components/common';
	@import '../../../components/skeleton';
	.loading {
		@include loading-sekeleton;
	}
	main {
		padding: 16px 0;
		display: grid;
		row-gap: 24px;
		align-content: start;
		@include main;
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
		height: 150px;
		width: env(height);
		object-fit: cover;
		object-position: center;
		aspect-ratio: 1/1;
	}
	.textfield {
		margin: 0 16px;
		height: 48px;
	}
	.btn {
		display: grid;
		padding: 0 16px;
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

<svelte:head>
	<title>Profil</title>
	<meta name="" content="" />
</svelte:head>

<div transition:slide>
	<MaterialAppMin>
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
			<span slot="title">Profile</span>
		</AppBar>
		<main>
			{#if user}
				<form id="user" on:submit|preventDefault="{submit}">
					<Card tile>
						<div class="thumb-wrapper">
							{#if imageUrl}
								<img
									class="thumb"
									src="{imageUrl}"
									alt="{user.name ?? ''}"
									on:error="{() => (imageUrl = '')}"
								/>
							{:else}
								<Icon size="{56}" path="{mdiImagePlus}" />
							{/if}
							<button
								type="button"
								on:click="{() => (show_pick_image = !show_pick_image)}"
							></button>
						</div>
					</Card>
					<br />
					<TextField class="textfield" outlined value="{user.username}" readonly
						>Username</TextField
					>
					<TextField
						outlined
						bind:value="{user.email}"
						type="email"
						autocomplete="email"
						rules="{rules.email}"
					>
						Email</TextField
					>
					<TextField
						outlined
						bind:value="{user.name}"
						placeholder="-"
						autocomplete="name"
						rules="{rules.name}">Nama</TextField
					>
					<TextField
						outlined
						bind:value="{user.telp}"
						placeholder="-"
						type="tel"
						autocomplete="tel-local"
						rules="{rules.telp}">Nomor Handphone</TextField
					>
					<Textarea
						autogrow
						rows="{3}"
						outlined
						value="{user.address ?? ''}"
						placeholder="-"
						readonly
					>
						<div>Alamat</div>
						<div slot="append">
							<Button
								fab
								icon
								text
								size="small"
								on:click="{async () => {
									if (!disableSubmit) {
										await submit();
									}
									goto('/courier/account/address/pin');
								}}"
							>
								<Icon class="grey-text text-darken-3" path="{mdiMapOutline}" />
							</Button>
						</div>
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
			<section class="btn">
				<Button
					form="user"
					type="submit"
					class="{disableSubmit ? '' : 'primary-color'}"
					disabled="{disableSubmit}">Perbarui</Button
				>
			</section>
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
