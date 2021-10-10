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
		Switch,
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
	} from '@mdi/js';
	import Snackbar from '$components/snackbar.svelte';
	import { onMount, onDestroy, getContext } from 'svelte';
	import { writable } from 'svelte/store';
	import { fade, slide } from 'svelte/transition';
	import { browser, dev } from '$app/env';
	import { goto } from '$app/navigation';
	import { assets } from '$app/paths';
	import { page } from '$app/stores';
	import { Diff } from '$lib/helper';
	import * as rules from '$lib/rules';
	import type { SellerClientApi } from '../__layout.svelte';
</script>

<script lang="ts">
	const client = getContext<SellerClientApi>('seller');
	const showProgress = writable(true);
	const progress = writable(0);
	const indeterminate = writable(true);
	let seller: SellerClientApi.Data.Seller;
	let store: SellerClientApi.Data.Store;
	let copied: any;
	let snackbar: Snackbar;
	let disableSubmit = true;
	$: {
		if (copied) {
			const changed = Diff.object(copied, seller);
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
			seller = await client.seller.auth();
			copied = Diff.objectCopy(seller);
			if (!seller.storeId) {
				throw new Error('');
			}
			store = await client.store.search({
				where: { id: seller.storeId },
				rejectOnNotFound: true,
			});
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
			const changed = Diff.object(copied, seller);
			if (!changed) {
				throw new Error('Tidak ada berubah');
			}
			await client.seller.update({
				where: { id: seller.id },
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
			<span slot="title">Profile</span>
		</AppBar>
		<main class="main">
			{#if seller && store}
				<form id="profile" class="data" on:submit|preventDefault="{submit}">
					<TextField outlined value="{seller.username}" readonly
						>Username</TextField>
					<TextField
						outlined
						bind:value="{seller.email}"
						type="email"
						autocomplete="email"
						rules="{rules.email}">
						Email</TextField>
					<TextField
						outlined
						bind:value="{seller.name}"
						placeholder="-"
						rules="{rules.name}">Nama</TextField>
				</form>
			{:else}
				<section class="data">
					<div class="textfield loading"></div>
					<div class="textfield loading"></div>
					<div class="textfield loading"></div>
					<div class="textfield loading"></div>
					<div class="textfield loading"></div>
				</section>
			{/if}
			<section class="btn">
				<Button
					form="profile"
					type="submit"
					class="{disableSubmit ? '' : 'primary-color'}"
					disabled="{disableSubmit}">Perbarui</Button>
			</section>
		</main>
		<Snackbar bind:this="{snackbar}" />
	</MaterialAppMin>
</div>

<style lang="scss">
	@import '../../../components/common';
	@import '../../../components/skeleton';
	.loading {
		@include loading-sekeleton;
	}
	.main {
		padding: 16px 0;
		@include main;
	}
	.data {
		padding: 16px;
		display: grid;
		row-gap: 16px;
	}
	.textfield {
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
		@include common-footer;
	}
</style>
