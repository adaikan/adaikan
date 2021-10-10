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
		Divider,
		Subheader,
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
	import { derived, writable } from 'svelte/store';
	import { fade, slide } from 'svelte/transition';
	import { browser, dev } from '$app/env';
	import { goto } from '$app/navigation';
	import { assets } from '$app/paths';
	import { navigating, page } from '$app/stores';
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
	$: {
		if (navigating && $navigating) {
			$showProgress = true;
		}
	}
	$: {
		if (seller) {
			update();
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
				throw new Error('Toko tidak ada');
			}
			store = await client.store.search({
				where: { id: seller.storeId },
				rejectOnNotFound: true,
			});
		} catch (error: any) {
			snackbar.setText(error.message);
			snackbar.show();
		} finally {
			$showProgress = false;
		}
	}
	async function release() {}
	async function update() {
		try {
			$showProgress = true;
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
		} finally {
			snackbar.show();
			$showProgress = false;
		}
	}
</script>

<svelte:head>
	<title>Pengaturan</title>
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
			<span slot="title">Pengaturan</span>
		</AppBar>
		<main class="main">
			<form id="setting" on:submit|preventDefault="{update}">
				{#if seller && store}
					<List>
						<Subheader>Notifications</Subheader>
						<ListItem>
							<span>Notifications</span>
							<span slot="subtitle"> Allow Notifications </span>
							<span slot="append">
								<Switch checked />
							</span>
						</ListItem>
						<Divider />
						<Subheader>Authentication</Subheader>
						<ListItem multiline>
							<span>Two Factor Authentication</span>
							<span slot="subtitle"
								>Using 2 factor authentication for Login</span>
							<span slot="append">
								<Switch bind:checked="{seller.mfa}" />
							</span>
						</ListItem>
					</List>
				{:else}
					<List>
						<Subheader><div class="label loading"></div></Subheader>
						<ListItem><div class="textfield loading"></div></ListItem>
						<ListItem><div class="textfield loading"></div></ListItem>
						<Subheader><div class="label loading"></div></Subheader>
						<ListItem><div class="textfield loading"></div></ListItem>
						<ListItem><div class="textfield loading"></div></ListItem>
					</List>
				{/if}
			</form>
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
	main {
		padding: 0;
	}
	form {
		display: grid;
		row-gap: 16px;
	}
	.label {
		width: 50%;
		height: 18px;
	}
	.textfield {
		height: 48px;
	}
	* :global {
		@include common-app;
		@include common-loader;
		@include common-appbar;
	}
</style>
