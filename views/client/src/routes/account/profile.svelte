<script context="module" lang="ts">
	import {
		MaterialAppMin,
		ProgressLinear,
		AppBar,
		Button,
		Icon,
		List,
		ListItem,
		Card,
		TextField,
		Dialog,
	} from 'svelte-materialify/src';
	import {
		mdiChevronLeft,
		mdiImagePlus,
		mdiCameraOutline,
		mdiImageOutline,
	} from '@mdi/js';

	import { onMount, onDestroy, getContext } from 'svelte';
	import { derived, writable } from 'svelte/store';
	import { fade, slide } from 'svelte/transition';
	import { wait, Diff, unsafeDuplicate, element_support } from '$lib/helper';
	import * as rules from '$lib/rules';

	import type { BuyerClient } from '../__layout.svelte';

	const showProgress = writable(true);
	const progress = writable(0);
	const indeterminate = writable(true);
</script>

<script lang="ts">
	const buyer = getContext<BuyerClient>('buyer');
	let profile = writable(buyer.get());
	let cached = {};
	let show_pick_image = false;
	let support_image_capture = false;
	let imageUrl = '';
	let image: File | undefined;
	let isSubmitDisable = true;
	onMount(init);
	onDestroy(release);
	async function init() {
		try {
			if (!$profile) {
				await buyer.ready;
				$profile = await buyer.auth();
				buyer.set($profile);
			}
			cached = unsafeDuplicate($profile);
			profile.subscribe((value) => {
				const changed = Diff.object(cached, value);
				if (changed) {
					isSubmitDisable = false;
				} else {
					isSubmitDisable = true;
				}
			});
			imageUrl = $profile.image ?? '';
			support_image_capture = element_support('input', 'capture');
		} catch (error: any) {
		} finally {
			loaded();
		}
	}
	async function release() {}
	async function save() {
		try {
			loading();
			isSubmitDisable = true;

			if (!$profile) return;

			const changed = Diff.object(cached, $profile);

			if (changed) {
				const result = await buyer.update(changed, image);
				buyer.set(result);
				Object.assign(cached, changed);
			}
		} catch (error: any) {
			console.error(error);
		} finally {
			loaded();
		}
	}
	function loading() {
		$showProgress = true;
	}
	function loaded() {
		$showProgress = false;
	}
	function inputFile(
		event: Event & {
			currentTarget: EventTarget & HTMLInputElement;
		}
	) {
		const file = event.currentTarget.files?.[0];
		if (file && profile) {
			show_pick_image = false;
			image = file;
			$profile.image = file.name;
			imageUrl = URL.createObjectURL(file);
		}
	}
</script>

<style lang="scss">
	@import '../../components/common';
	@import '../../components/skeleton';
	.loading {
		@include loading-sekeleton;
	}
	main {
		padding: 16px 0;
		display: grid;
		align-content: start;
		@include main;
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
	.wrapper-image {
		padding: 16px;
		display: grid;
		place-items: center;
	}
	.image {
		width: 150px;
		object-fit: contain;
		object-position: center;
		aspect-ratio: 1;
	}
	.data,
	form {
		display: grid;
		row-gap: 16px;
	}
	.textfield {
		height: 48px;
		padding: 0 16px;
	}
	.btn {
		display: grid;
		padding: 0 16px;
	}
	* :global {
		@include common-app;
		@include common-loader;
		@include common-appbar;
		@include common-footer;
		.textfield {
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
			<span slot="title">Profil</span>
		</AppBar>
		<main>
			{#if $profile}
				<form id="profile" on:submit|preventDefault="{save}">
					<Card tile>
						<div class="thumb-wrapper">
							{#if imageUrl}
								<img class="thumb" src="{imageUrl}" alt="" />
							{:else}
								<Icon size="{56}" path="{mdiImagePlus}" />
							{/if}
							<button type="button" on:click="{() => (show_pick_image = !show_pick_image)}"
							></button>
						</div>
					</Card>
					<br />
					<TextField
						class="textfield"
						value="{$profile.username}"
						autocomplete="username"
						outlined
						readonly>Username</TextField
					>
					<TextField
						class="textfield"
						bind:value="{$profile.email}"
						type="email"
						autocomplete="email"
						outlined
						rules="{rules.email}">Email</TextField
					>
					<TextField
						class="textfield"
						bind:value="{$profile.name}"
						autocomplete="name"
						placeholder="-"
						rules="{rules.name}"
						outlined>Nama</TextField
					>
					<TextField
						class="textfield"
						bind:value="{$profile.telp}"
						type="tel"
						autocomplete="tel"
						placeholder="-"
						rules="{rules.telp}"
						outlined>Nomor Handphone</TextField
					>
				</form>
			{:else}
				<section class="data">
					<Card tile>
						<section class="wrapper-image">
							<div class="image loading"></div>
						</section>
					</Card>
					<br />
					<div class="textfield loading"></div>
					<div class="textfield loading"></div>
					<div class="textfield loading"></div>
					<div class="textfield loading"></div>
					<div class="textfield loading"></div>
					<div class="textfield loading"></div>
					<div class="textfield loading"></div>
					<div class="textfield loading"></div>
				</section>
			{/if}
			<br />
			<section class="btn">
				<Button
					class="{isSubmitDisable ? '' : 'primary-color'}"
					type="submit"
					form="profile"
					disabled="{isSubmitDisable}">Simpan</Button
				>
			</section>
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
