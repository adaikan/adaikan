<script context="module" lang="ts">
	import {
		MaterialAppMin,
		ProgressLinear,
		AppBar,
		Footer,
		Button,
		Icon,
		Menu,
		NavigationDrawer,
		Avatar,
		List,
		ListGroup,
		ListItem,
		ListItemGroup,
		Card,
		TextField,
		Checkbox,
	} from 'svelte-materialify/src';
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
		mdiImagePlus,
	} from '@mdi/js';

	import { onMount, onDestroy, getContext } from 'svelte';
	import { derived, writable } from 'svelte/store';
	import { fade, slide } from 'svelte/transition';
	import { browser, dev } from '$app/env';
	import { goto } from '$app/navigation';
	import { assets } from '$app/paths';
	import { page } from '$app/stores';
	import { wait, Diff, unsafeDuplicate } from '$lib/helper';
	import * as rules from '$lib/rules';

	import type { BuyerClient } from '../__layout.svelte';

	const showProgress = writable(true);
	const progress = writable(0);
	const indeterminate = writable(true);
</script>

<script lang="ts">
	const buyer = getContext<BuyerClient>('buyer');
	let profile = writable(buyer.get());
	let address: BuyerClient.Address | undefined;
	let cached = {};
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
			const list = await buyer.address.getAll();
			for (const item of list) {
				if (item.selected) {
					address = item;
				}
			}
			imageUrl = $profile.image ?? '';
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
			image = file;
			$profile.image = file.name;
			imageUrl = URL.createObjectURL(file);
		}
	}
</script>

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
			color="secondary-color" />
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
					</Card>
					<br />
					<TextField
						class="textfield"
						value="{$profile.username}"
						autocomplete="username"
						outlined
						readonly>Username</TextField>
					<TextField
						class="textfield"
						bind:value="{$profile.email}"
						type="email"
						autocomplete="email"
						outlined
						rules="{rules.email}">Email</TextField>
					<TextField
						class="textfield"
						bind:value="{$profile.name}"
						autocomplete="name"
						placeholder="-"
						rules="{rules.name}"
						outlined>Nama</TextField>
					<TextField
						class="textfield"
						bind:value="{$profile.telp}"
						type="tel"
						autocomplete="tel"
						placeholder="-"
						rules="{rules.telp}"
						outlined>Nomor Handphone</TextField>
					<TextField
						class="textfield"
						value="{address?.place ?? ''}"
						placeholder="-"
						outlined
						autocomplete="address-level1 address-level2 address-level3 address-level4"
						readonly>Alamat</TextField>
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
					disabled="{isSubmitDisable}">Simpan</Button>
			</section>
		</main>
	</MaterialAppMin>
</div>

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
