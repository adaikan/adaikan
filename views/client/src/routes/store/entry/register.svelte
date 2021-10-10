<script context="module" lang="ts">
	import { logo } from './__layout.svelte';
	import {
		MaterialAppMin,
		AppBar,
		Footer,
		Button,
		Icon,
		TextField,
	} from 'svelte-materialify/src';
	import ProgressLinear from '$components/progress-linear.svelte';
	import Alert from '$components/alert.svelte';
	import {
		mdiChevronLeft,
		mdiChevronRight,
		mdiStarOutline,
		mdiStar,
		mdiEye,
		mdiEyeOff,
		mdiCheck,
	} from '@mdi/js';

	import { onMount, onDestroy, getContext } from 'svelte';
	import { writable } from 'svelte/store';
	import { fade, slide, scale } from 'svelte/transition';
	import { getStores, navigating, page, session } from '$app/stores';
	import { goto } from '$app/navigation';

	import * as rules from '$lib/rules';

	import type { SellerClientApi } from '../__layout.svelte';
</script>

<script lang="ts">
	const client = getContext<SellerClientApi>('seller');
	let alert: Alert;
	let loader: ProgressLinear;
	let email = '';
	let username = '';
	let password = '';
	let showPassword = false;
	let disableSubmit = false;

	onMount(init);
	onDestroy(release);

	function init() {
		loader.loaded();
	}
	function release() {}
	async function submit() {
		try {
			loader.loading();
			alert.hide();
			disableSubmit = true;
			const data = await client.seller.register({
				email,
				username,
				password,
			});
			alert.setState('success');
			alert.setText('Berhasil mendaftar');
			alert.show();
			await loader.sequencing();
			goto('/store', { replaceState: true });
		} catch (error: any) {
			alert.setState('error');
			alert.setText(error.message);
			disableSubmit = false;
			alert.show();
			loader.loaded();
		}
	}
</script>

<svelte:head>
	<title>Mendaftar</title>
	<meta name="" content="" />
</svelte:head>

<div transition:fade class="primary-color">
	<MaterialAppMin>
		<ProgressLinear bind:this="{loader}" />
		<AppBar class="transparent" flat>
			<span slot="icon">
				<Button fab icon text size="small" on:click="{() => history.back()}">
					<Icon path="{mdiChevronLeft}" />
				</Button>
			</span>
		</AppBar>
		<main>
			<form on:submit|preventDefault="{submit}">
				<fieldset>
					<legend>
						<img
							class="logo"
							src="{logo}"
							alt="ada ikan"
							width="64"
							height="64" />
						<span>Buat Akun Penjual</span>
					</legend>
					<div class="w-full">
						<Alert bind:this="{alert}" />
					</div>
					<div class="content">
						<TextField
							class="textfield"
							bind:value="{email}"
							placeholder="Email"
							flat
							solo
							rules="{rules.email}"
							autocomplete="email"
							type="email"
							required />
						<TextField
							class="textfield"
							bind:value="{username}"
							placeholder="Username"
							flat
							solo
							rules="{rules.username}"
							autocomplete="username"
							required />
						<TextField
							class="textfield"
							bind:value="{password}"
							placeholder="Password"
							flat
							solo
							rules="{rules.password}"
							type="{showPassword ? 'text' : 'password'}"
							autocomplete="new-password"
							required>
							<div slot="append">
								<Button
									fab
									icon
									text
									size="small"
									on:click="{() => {
										showPassword = !showPassword;
									}}">
									<Icon
										class="grey-text text-darken-3"
										path="{showPassword ? mdiEyeOff : mdiEye}" />
								</Button>
							</div>
						</TextField>
					</div>
					<div class="btns">
						<Button depressed type="submit" disabled={disableSubmit}>Buat</Button>
						<div class="t-center">
							<div class="f-14 f-500">Punya Akun?</div>
							<a class="white-text" href="/store/entry/login"> Log in </a>
						</div>
					</div>
				</fieldset>
			</form>
		</main>
	</MaterialAppMin>
</div>

<style lang="scss">
	@import '../../../components/common';
	main {
		flex: 1 0 auto;
		padding: 32px;
		display: flex;
		flex-flow: column nowrap;
	}
	form {
		margin: auto;
		flex: 1 0 auto;
		position: relative;
		display: grid;
		align-content: space-between;
		row-gap: 32px;
		@include medium-up {
			width: 500px;
		}
	}
	fieldset {
		display: contents;
	}
	legend {
		display: grid;
		place-items: center;
		row-gap: 16px;
		font-weight: 600;
	}
	.content {
		width: 100%;
		display: grid;
		row-gap: 16px;
	}
	.btns {
		width: 100%;
		display: grid;
		row-gap: 32px;
	}
	.t-center {
		text-align: center;
	}
	.f-14 {
		font-size: 14px;
	}
	.f-500 {
		font-weight: 500;
	}
	.w-full {
		width: 100%;
	}
	* :global {
		@include common-app;
		@include common-appbar;
		@include common-loader;
		.textfield {
			.s-input__slot {
				border-radius: 6px;
				background-color: white;
			}
			.s-input__details {
				font-size: 13px;
				font-weight: 500;
			}
		}
	}
</style>
