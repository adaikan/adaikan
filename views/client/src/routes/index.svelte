<script context="module" lang="ts">
	import {
		MaterialAppMin,
		ProgressLinear,
		AppBar,
		Footer,
		Button,
		Icon,
		Menu,
		ListItem,
		NavigationDrawer,
		Avatar,
		List,
		ListItemGroup,
		Divider,
		Overlay,
		Badge,
		TextField,
	} from 'svelte-materialify/src';
	import Carousel from 'svelte-carousel/src/components/Carousel/Carousel.svelte';
	import Cards from '$components/cards.svelte';
	import Card from '$components/card.svelte';
	import {
		mdiMenu,
		mdiDotsVertical,
		mdiViewGridOutline,
		mdiClipboardTextOutline,
		mdiSync,
		mdiCheck,
		mdiTruckOutline,
		mdiCubeOutline,
		mdiAccount,
		mdiRefresh,
		mdiMagnify,
	} from '@mdi/js';

	import { onMount, onDestroy, getContext } from 'svelte';
	import { writable } from 'svelte/store';
	import { fade, slide } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { assets } from '$app/paths';
	import { browser, dev } from '$app/env';
	import { page, navigating } from '$app/stores';
	import { getImageUrl } from '$lib/helper';
	import navigation from '$lib/main-nav';

	import type { BuyerClient } from './__layout.svelte';

	let showProgress = writable(true);
	let progress = writable(0);
	let indeterminate = writable(true);
</script>

<script lang="ts">
	const client = getContext<BuyerClient>('buyer');
	let product: (BuyerClient.Product & { store: BuyerClient.Store })[] = [];
	let searchResult: (BuyerClient.Product & { store: BuyerClient.Store })[] = [];
	let slides: string[] = [];
	let fakeData = Array(6);
	let fakeSlide = true;
	let mode: 'search' | 'display' = 'display';
	let activeNav = '';
	let searchText = '';

	$: search(searchText);

	navigating.subscribe((value) => value && loading());
	onMount(init);
	onDestroy(release);
	async function init() {
		try {
			setNav(location.pathname);
			await client.ready;
			product = await client.api.product.getAll();
			slides = await client.api.business.slide();
			fakeData = Array(0);
			fakeSlide = false;
		} catch (error: any) {
		} finally {
			loaded();
		}
	}
	async function release() {}
	function setNav(path: string) {
		activeNav = path;
	}
	function loading() {
		$showProgress = true;
	}
	function loaded() {
		$showProgress = false;
	}
	async function search(text: string) {
		if (text) {
			try {
				loading();
				mode = 'search';
				fakeData = Array(6);
				searchResult = await client.api.product.searchMany({
					where: {
						OR: [
							{ name: { contains: text, mode: 'insensitive' } },
							{ store: { name: { contains: text, mode: 'insensitive' } } },
						],
					},
					include: {
						store: true,
					},
				});
			} catch (error: any) {
			} finally {
				fakeData = Array(0);
				loaded();
			}
		} else {
			mode = 'display';
		}
	}
</script>

<style lang="scss">
	@import '../components/common';
	@import '../components/skeleton';
	.loading {
		@include loading-sekeleton;
	}
	.carousel {
		.img {
			object-fit: cover;
			object-position: center;
			max-width: 100%;
			max-height: 450px;
			aspect-ratio: 4/3;
			display: grid;
			border: 1px solid black;
			@include medium-up {
				aspect-ratio: 16/9;
			}
		}
	}
	.main {
		display: grid;
		grid-template-rows: auto;
		grid-template-columns: 100%;
		align-content: start;
		padding: 24px 16px;
		@include main;
	}
	a {
		text-decoration: none;
		color: inherit;
	}
	.div {
		width: 100%;
		height: 16px;
	}
	.nav {
		display: grid;
		align-items: center;
		width: stretch;
		ul {
			padding: 0;
			display: grid;
			grid-template-columns: repeat(4, 1fr);
			justify-items: center;
		}
		li {
			list-style: none;
			padding: 2px;
		}
		a {
			display: grid;
			justify-items: center;
			row-gap: 2px;
			text-decoration: none;
			border-radius: 6px;
			text-transform: capitalize;
			font-size: 11px;
		}
	}
	* :global {
		@include common-app;
		@include common-loader;
		@include common-appbar {
			label {
				display: none;
			}
			.s-app-bar__title {
				display: none;
			}
			.s-input.dense .s-input__slot,
			.s-input__slot {
				margin-bottom: 0;
			}
			.s-text-field.dense input {
				padding: 0;
				line-height: normal;
			}
		}
		@include common-footer;
		.search-box {
			padding: 0 16px;
		}
		.carousel {
			.sc-carousel__carousel-container {
				position: relative;
			}
			.sc-carousel-dots__container {
				position: absolute;
				bottom: 8px;
			}
		}
		.nav {
			.s-btn.icon,
			.s-btn.s-btn--fab {
				border-radius: 6px;
			}
		}
	}
</style>

<svelte:head>
	<title>Home</title>
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
			color="secondary-color"
		/>
		<AppBar class="white {$showProgress ? 'top-4' : ''}">
			<TextField
				class="search-box"
				bind:value="{searchText}"
				dense
				outlined
				flat
				clearable
				placeholder="Cari Ikan..."
			>
				<Button slot="prepend" icon class="grey-text text-darken-4">
					<Icon path="{mdiMagnify}" />
				</Button>
			</TextField>
		</AppBar>
		<main class="main">
			{#if mode == 'display'}
				{#if browser}
					<section class="carousel">
						{#if fakeSlide}
							<div class="img"></div>
						{:else}
							<Carousel dots arrows="{false}">
								{#each slides as src}
									<img class="img" src="{src}" alt="" />
								{/each}
							</Carousel>
						{/if}
					</section>
				{:else}
					<section class="carousel">
						<div class="img loading"></div>
					</section>
				{/if}
				<div class="div"></div>
				<Cards>
					{#each product as item}
						<a href="/detail/{item.id}">
							<Card
								data="{{
									image: item.image,
									name: item.name,
									price: item.price,
									store: item.store.name,
								}}"
								imageLoader="{getImageUrl}"
							/></a
						>
					{/each}
					{#each fakeData as value}
						<Card />
					{/each}
				</Cards>
			{:else}
				<Cards>
					{#if $showProgress}
						{#each fakeData as value}
							<Card />
						{/each}
					{:else}
						{#each searchResult as item}
							<a href="/detail/{item.id}">
								<Card
									data="{{
										image: item.image,
										name: item.name,
										price: item.price,
										store: item.store.name,
									}}"
									imageLoader="{getImageUrl}"
								/></a
							>
						{/each}
					{/if}
				</Cards>
			{/if}
		</main>
		<Footer class="white elevation-5">
			<nav class="nav">
				<ul>
					{#each navigation as item}
						<li>
							<Button text fab size="small">
								<a
									class="{activeNav == item.link
										? 'primary-text'
										: 'grey-text text-darken-3'}"
									href="{item.link}"
									><Icon path="{item.icon}" />
									<div>{item.name}</div>
								</a>
							</Button>
						</li>
					{/each}
				</ul>
			</nav>
		</Footer>
	</MaterialAppMin>
</div>
