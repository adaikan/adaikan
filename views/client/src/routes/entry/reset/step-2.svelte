<script context="module" lang="ts">
	import {
		MaterialAppMin,
		ProgressLinear,
		Button,
		TextField,
		AppBar,
		Icon,
		Card,
	} from 'svelte-materialify/src';
	import { mdiChevronLeft } from '@mdi/js';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
</script>

<script lang="ts">
	let loading = true;
	const pinChar = [0, 1, 2, 3, 4, 5];
	let inputs: HTMLInputElement[] = [];
	let second = 0;
	let id = reset();
	function reset() {
		second = 40;
		return setInterval(() => {
			second -= 1;
			if (second == 0) {
				clearInterval(id);
			}
		}, 1000);
	}
	function onInput(this: HTMLInputElement) {
		if (this.value.length) {
			this.value = this.value.slice(-1);
			(this.nextElementSibling as HTMLElement)?.focus();
		}
	}
	onMount(() => {
		loading = false;
	});
</script>

<style lang="scss">
	@import '../../../components/common';
	@import '../../../components/elevation';
	main {
		display: flex;
		width: 100%;
		height: 100%;
		padding: 32px 16px;
		@include main;
	}
	.surface {
		width: 100%;
		height: 100%;
		display: grid;
		grid-auto-rows: auto;
		row-gap: 32px;
	}
	fieldset {
		display: contents;
	}
	legend {
		display: grid;
		row-gap: 2px;
	}
	.content {
		width: 100%;
		display: grid;
		grid-template-rows: max-content max-content;
		row-gap: 32px;
	}
	.pin {
		display: flex;
		justify-content: center;
		gap: 8px;
		@include medium-up {
			gap: 16px;
		}
	}
	.input {
		text-align: center;
		width: 40px;
		height: 40px;
		border-radius: 6px;
		border: 2px solid black;
		transition: border ease 250ms;
	}
	.btns {
		display: grid;
		padding: 0 16px;
		row-gap: 16px;
	}
	.t-center {
		text-align: center;
	}
	.f-500 {
		font-weight: 500;
	}
	* :global {
		@include common-app;
		@include common-loader;
		@include common-appbar;
		.card {
			display: grid;
			row-gap: 16px;
			padding: 16px;
			@include elevation;
		}
		.textfield {
			.s-text-field__input {
				input {
					max-height: 36px;
					padding-bottom: 6px;
					line-height: 34px;
				}
			}
		}
	}
</style>

<svelte:head>
	<title>Verifikasi Email</title>
	<meta name="" content="" />
</svelte:head>

<div>
	<MaterialAppMin>
		<ProgressLinear
			bind:active="{loading}"
			indeterminate
			height="4px"
			backgroundColor="secondary-color"
			color="secondary-color"
		/>
		<AppBar class="primary-color">
			<div slot="icon">
				<Button depressed fab text on:click="{() => history.back()}">
					<Icon path="{mdiChevronLeft}" />
				</Button>
			</div>
			<span slot="title">Reset Password</span>
		</AppBar>
		<main>
			<form class="surface">
				<fieldset>
					<div class="content">
						<Card class="card" outlined>
							<legend class="f-500 t-center"
								><div>Kode verifikasi telah dikirimkan melalui</div>
								<div class="red-text darken-1">reskiwahdaniah123@gmail.com</div>
								<div>Mohon verifikasi.</div></legend
							>
							<div class="pin">
								{#each pinChar as char}
									<input
										class="input"
										type="number"
										bind:this="{inputs[char]}"
										on:input="{onInput}"
									/>
								{/each}
							</div>
						</Card>
						<div class="btns">
							<Button class="primary-color black-text">verifikasi</Button>
							{#if second}
								<div class="t-center">
									Mohon tunggu <span>{second}</span> detik untuk mengirim ulang.
								</div>
							{:else}
								<Button
									class="black-text"
									on:click="{() => {
										id = reset();
									}}">Kirim Ulang</Button
								>
							{/if}
						</div>
					</div>
				</fieldset>
			</form>
		</main>
	</MaterialAppMin>
</div>
