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
		Textarea,
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
		mdiMapOutline,
		mdiChevronLeft,
		mdiImagePlus,
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
				await client.courier.uploadImage(changed.image, image);
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
			image = file;
			user.image = file.name;
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
			<span slot="title">Profile</span>
		</AppBar>
		<main>
			{#if user}
				<form id="user" on:submit|preventDefault="{submit}">
					<Card tile>
						<label class="thumb-wrapper">
							<input
								type="file"
								accept="image/*"
								capture
								on:input="{inputFile}" />
							{#if imageUrl}
								<img
									class="thumb"
									src="{imageUrl}"
									alt="{user.name ?? ''}"
									on:error="{() => (imageUrl = '')}" />
							{:else}
								<Icon size="{56}" path="{mdiImagePlus}" />
							{/if}
						</label>
					</Card>
					<br />
					<TextField class="textfield" outlined value="{user.username}" readonly
						>Username</TextField>
					<TextField
						outlined
						bind:value="{user.email}"
						type="email"
						autocomplete="email"
						rules="{rules.email}">
						Email</TextField>
					<TextField
						outlined
						bind:value="{user.name}"
						placeholder="-"
						autocomplete="name"
						rules="{rules.name}">Nama</TextField>
					<TextField
						outlined
						bind:value="{user.telp}"
						placeholder="-"
						type="tel"
						autocomplete="tel-local"
						rules="{rules.telp}">Nomor Handphone</TextField>
					<Textarea
						autogrow
						rows="{3}"
						outlined
						value="{user.address ?? ''}"
						placeholder="-"
						readonly>
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
								}}">
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
