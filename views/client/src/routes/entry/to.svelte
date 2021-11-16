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

	import { logo } from './__layout.svelte';

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
			<main class="primary-color">
				<section class="surface">
					<img
						class="logo"
						src="{logo}"
						alt="ada ikan"
						width="80"
						height="80" />
					<div class="links">
						<a href="/courier/entry">Kurir</a>
						<a href="/store/entry">Toko</a>
						<a href="/entry">Pembeli</a>
					</div>
				</section>
			</main>
		</section>
	</MaterialAppMin>
</div>

<style lang="scss">
	@import '../../components/common';
	main {
		width: 100vw;
		min-height: 100vh;
		padding: 32px;
		display: grid;
		place-items: stretch;
	}
	.surface {
		position: relative;
		display: grid;
		grid-template-rows: 1fr 1fr 1fr;
		place-items: center;
	}
	img {
		margin: auto;
	}
	.links {
		width: 100%;
		display: grid;
		gap: 16px;
		@include medium-up {
			width: 420px;
		}
	}
	a {
		color: inherit;
		text-decoration: none;
		padding: 8px 16px;
		background-color: white;
		border-radius: 4px;
	}
	* :global {
		@include common-app;
		@include common-loader;
		@include common-appbar {
			position: fixed;
		};
	}
</style>
