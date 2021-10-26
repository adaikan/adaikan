<script context="module" lang="ts">
	import { logo } from './__layout.svelte';
	import {
		MaterialAppMin,
		AppBar,
		Button,
		Icon,
		TextField,
	} from 'svelte-materialify/src';
	import ProgressLinear from '$components/progress-linear.svelte';
	import Alert from '$components/alert.svelte';
	import { mdiChevronLeft, mdiEye, mdiEyeOff } from '@mdi/js';

	import { onMount, onDestroy, getContext } from 'svelte';
	import { fade } from 'svelte/transition';
	import { goto } from '$app/navigation';

	import * as rules from '$lib/rules';

	import type { ObserverUnsafe } from '$lib/helper';
	import type { SellerClientApi } from '../__layout.svelte';
</script>

<script lang="ts">
	const client = getContext<SellerClientApi>('seller');
	const is_desktop = getContext<ObserverUnsafe<boolean>>('is_desktop');
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

			await client.seller.register({
				email,
				username,
				password,
			});

			alert.setState('success');
			alert.setText('Berhasil mendaftar');
			alert.show();

			goto('/store', { replaceState: true });
		} catch (error: any) {
			alert.setState('error');
			alert.setText(error.message);
			alert.show();

			disableSubmit = false;
		} finally {
			loader.loaded();
		}
	}
</script>

<style lang="scss">
	@import '../../../components/common';
	@import '../../../components/elevation';
	.card {
		@include elevation;
		border-radius: 6px;
		background-color: white;
	}
	main {
		max-width: 100vw;
		min-height: 100vh;
		padding: 32px;
		display: grid;
	}
	form {
		margin: auto;
		width: 100%;
		height: 100%;
		position: relative;
		display: grid;
		place-items: center;
		row-gap: 32px;
		transition: all 250ms ease;
		@include medium-up {
			width: 420px;
		}
	}
	fieldset {
		display: contents;
	}
	.title {
		display: grid;
		place-items: center;
		gap: 8px;
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
		row-gap: 8px;
	}
	.t-center {
		text-align: center;
	}
	.t-end {
		text-align: end;
	}
	.f-18 {
		font-size: 18px;
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
	.p-32 {
		padding: 32px;
	}
	.spacer {
		height: 44px;
	}
	* :global {
		@include common-app;
		@include common-loader;
		@include common-appbar;
		.textfield {
			.s-input__slot {
				border-radius: 6px;
				background-color: white;
			}
			.s-input__details {
				font-size: 13px;
				font-weight: 500;
			}
			.s-text-field__input label {
				overflow: visible;
			}
			.s-input input,
			.s-list-item__title {
				line-height: normal;
			}
		}
		.hover {
			border: 2px solid transparent;
			&:hover {
				border: 2px solid black;
			}
		}
	}
</style>

<svelte:head>
	<title>Mendaftar Penjual</title>
	<meta name="description" content="Mendaftar Akun Penjual" />
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
			{#if $is_desktop}
				<header transition:fade class="title">
					<img
						class="logo"
						src="{logo}"
						alt="ada ikan"
						width="64"
						height="64"
					/>
					<span>Ada Ikan</span>
				</header>
			{/if}
			<div class="spacer"></div>
			<form
				on:submit|preventDefault="{submit}"
				class="{$is_desktop ? 'card p-32' : ''}"
			>
				<fieldset>
					<div class="title">
						{#if !$is_desktop}
							<img
								transition:fade
								class="logo"
								src="{logo}"
								alt="ada ikan"
								width="64"
								height="64"
							/>
							<span transition:fade>Mendaftar</span>
						{:else}
							<span class="f-18 f-500">Mendaftar</span>
						{/if}
					</div>
					<div class="w-full">
						<Alert bind:this="{alert}" />
					</div>
					<div class="content">
						<TextField
							class="textfield"
							bind:value="{email}"
							placeholder="{$is_desktop ? '' : 'Email'}"
							solo="{!$is_desktop}"
							outlined="{$is_desktop}"
							rules="{rules.email}"
							autocomplete="email"
							type="email"
							required
						>
							{#if $is_desktop}
								Email
							{/if}
						</TextField>
						<TextField
							class="textfield"
							bind:value="{username}"
							placeholder="{$is_desktop ? '' : 'Username'}"
							solo="{!$is_desktop}"
							outlined="{$is_desktop}"
							rules="{rules.username}"
							autocomplete="username"
							required
						>
							{#if $is_desktop}
								Username
							{/if}
						</TextField>
						<TextField
							class="textfield"
							bind:value="{password}"
							placeholder="{$is_desktop ? '' : 'Password'}"
							solo="{!$is_desktop}"
							outlined="{$is_desktop}"
							rules="{rules.password}"
							type="{showPassword ? 'text' : 'password'}"
							autocomplete="new-password"
							required
						>
							<div>
								{#if $is_desktop}
									Password
								{/if}
							</div>
							<div slot="append">
								<Button
									fab
									icon
									text
									size="small"
									on:click="{() => {
										showPassword = !showPassword;
									}}"
								>
									<Icon
										class="grey-text text-darken-3"
										path="{showPassword ? mdiEyeOff : mdiEye}"
									/>
								</Button>
							</div>
						</TextField>
					</div>
					<div class="btns">
						<Button
							type="submit"
							size="large"
							disabled="{disableSubmit}"
							outlined="{$is_desktop}">Daftar</Button
						>
						<div class="t-center black-text">
							<div class="f-14 f-500">Punya Akun?</div>
							<a class="{$is_desktop ? 'primary-text' : 'white-text'}" href="/store/entry/login"> Log in </a>
						</div>
					</div>
				</fieldset>
			</form>
		</main>
	</MaterialAppMin>
</div>
