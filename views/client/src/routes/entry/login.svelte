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
		mdiEye,
		mdiEyeOff,
		mdiCheck,
		mdiChevronLeft,
		mdiChevronRight,
		mdiStarOutline,
		mdiStar,
	} from '@mdi/js';

	import { onMount, onDestroy, getContext } from 'svelte';
	import { writable } from 'svelte/store';
	import { fade } from 'svelte/transition';
	import { getStores, navigating, page, session } from '$app/stores';
	import { goto } from '$app/navigation';

	import type { Context } from './__layout.svelte';
	import type { BuyerClient } from '../__layout.svelte';
</script>

<script lang="ts">
	const { buyer } = getContext<Context>('layout');
	const user = getContext<BuyerClient>('buyer');
	let alert: Alert;
	let loader: ProgressLinear;
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
			const data = await buyer.login({
				username,
				password,
			});
			user.set(data);
			alert.setState('success');
			alert.setText('Berhasil Masuk');
			alert.show();
			await loader.sequencing();
			goto('/', { replaceState: true });
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
	<title>Masuk</title>
	<meta name="" content="" />
</svelte:head>

<div transition:fade class="primary-color">
	<MaterialAppMin>
		<ProgressLinear bind:this="{loader}" />
		<AppBar class="transparent" tile flat>
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
						<span>Masuk</span>
					</legend>
					<div class="w-full">
						<Alert bind:this="{alert}" />
					</div>
					<div class="content">
						<TextField
							bind:value="{username}"
							class="textfield"
							placeholder="Username"
							flat
							solo
							autocomplete="username"
							required />
						<div>
							<TextField
								class="textfield"
								bind:value="{password}"
								placeholder="Password"
								flat
								solo
								type="{showPassword ? 'text' : 'password'}"
								autocomplete="current-password"
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
							<div class="t-end f-14">
								<a class="white-text" href="/entry/reset">Lupa Password?</a>
							</div>
						</div>
					</div>
					<div class="btns">
						<Button depressed type="submit" disabled={disableSubmit}>Masuk</Button>
						<div class="t-center f-14">
							<a class="white-text" href="/courier/entry/login">Masuk Kurir?</a>
						</div>
					</div>
				</fieldset>
			</form>
		</main>
	</MaterialAppMin>
</div>

<style lang="scss">
	@import '../../components/common';
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
		row-gap: 8px;
	}

	.t-center {
		text-align: center;
	}

	.t-end {
		text-align: end;
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
		}
	}
</style>
