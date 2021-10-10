<script context="module" lang="ts">
	// import logo from '$static/logo/logo.png';
	import {
		MaterialAppMin,
		ProgressLinear,
		AppBar,
		Footer,
		Button,
		Icon,
		Textarea,
	} from 'svelte-materialify/src';
	import {
		mdiChevronLeft,
		mdiChevronRight,
		mdiStarOutline,
		mdiStar,
	} from '@mdi/js';
	import { goto } from '$app/navigation';
	import { onMount, onDestroy, getContext } from 'svelte';
	import { writable } from 'svelte/store';
	import { cubicIn } from 'svelte/easing';
	import { fade, slide, scale } from 'svelte/transition';

	import { logo } from './_layout.svelte';

	let theme = writable<'light' | 'dark'>('light');
	let showProgress = writable(true);
	let progress = writable(0);
	let indeterminate = writable(true);
</script>

<script lang="ts">
	onMount(init);
	onDestroy(release);
	function init() {
		loaded();
	}
	function release() {}
	function loading() {
		$showProgress = true;
	}
	function loaded() {
		$showProgress = false;
	}
</script>

<svelte:head>
	<title>Entry</title>
	<meta name="" content="" />
</svelte:head>

<div transition:fade>
	<MaterialAppMin theme="{$theme}">
		<ProgressLinear
			bind:active="{$showProgress}"
			bind:indeterminate="{$indeterminate}"
			bind:value="{$progress}"
			backgroundColor="secondary-color"
			color="secondary-color" />
		<section class="container">
			<AppBar class="transparent" tile flat>
				<span slot="icon">
					<Button fab icon text size="small" on:click="{() => history.back()}">
						<Icon path="{mdiChevronLeft}" />
					</Button>
				</span>
			</AppBar>
			<section class="layout primary-color">
				<div class="surface">
					<img
						class="logo"
						src="{logo}"
						alt="ada ikan"
						width="150"
						height="150" />
					<div class="btns">
						<Button depressed on:click="{() => goto('/courier/entry/login')}"
							>Masuk</Button>
						<Button depressed on:click="{() => goto('/courier/entry/register')}"
							>Daftar</Button>
					</div>
				</div>
			</section>
		</section>
	</MaterialAppMin>
</div>

<style lang="scss">
	@import '../../../components/common';
	.layout {
		max-width: 100vw;
		min-height: 100vh;
		padding: 32px;
		display: grid;
	}
	.surface {
		position: relative;
		display: grid;
		place-items: center;
	}
	.btns {
		width: 100%;
		position: absolute;
		bottom: 0;
		display: grid;
		grid-auto-flow: column;
		column-gap: 16px;
	}
	* :global {
		@include common-app;
		@include common-loader;
		@include common-appbar {
			position: fixed;
		};
	}
</style>
