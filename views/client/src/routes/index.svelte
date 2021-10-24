<script context="module" lang="ts">
	import { MaterialAppMin } from 'svelte-materialify/src';
	import Appbar from './_appbar.svelte';
	import Footer from './_footer.svelte';
	import Carousel from './_carousel.svelte';
	import Cards from '$components/cards.svelte';
	import Card from '$components/card.svelte';
	import Featured from './_featured.svelte';
	import ProgressLinear from '$components/progress-linear.svelte';

	import { onMount, onDestroy, getContext } from 'svelte';
	import { slide } from 'svelte/transition';
	import { getImageUrl, ObserverUnsafe, wait } from '$lib/helper';

	import type { BuyerClient, Service } from './__layout.svelte';
</script>

<script lang="ts">
	const client = getContext<BuyerClient>('buyer');
	const is_desktop = getContext<ObserverUnsafe<boolean>>('is_desktop');
	const service = getContext<Service>('service');

	let product: (BuyerClient.Product & { store: BuyerClient.Store })[] = [];
	let searchResult: (BuyerClient.Product & { store: BuyerClient.Store })[] = [];
	let slides: { src: string; href: string }[] = [];
	let fakeData = Array(6);
	let progress: ProgressLinear;
	let mode: 'search' | 'display' = 'display';
	let searchText = '';

	$: loading = progress?.active;
	$: search(searchText);

	onMount(init);
	onDestroy(release);

	async function init() {
		try {
			await client.ready;
			slides = await client.api.business.slide();
			product = await client.api.product.getAll();
			fakeData = Array(0);
		} catch (error: any) {
		} finally {
			progress.loaded();
		}
	}
	async function release() {}
	async function search(text: string) {
		if (text) {
			try {
				progress.loading();
				mode = 'search';
				fakeData = Array(6);
				await wait({
					timeout: 250,
					delay: 1000,
					arg: text,
					callback: searching,
				});
			} catch (error: any) {
			} finally {
				fakeData = Array(0);
				progress.loaded();
			}
		} else {
			mode = 'display';
		}
	}
	async function searching(text: string) {
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
	}
</script>

<style lang="scss">
	@import '../components/common';
	.main {
		padding: 16px 0;
		display: grid;
		grid-template-rows: auto;
		grid-template-columns: 100%;
		align-content: start;
		gap: 16px;
	}
	a {
		text-decoration: none;
		color: inherit;
	}
	* :global {
		@include common-app;
		@include common-loader;
	}
</style>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="ada ikan marketplace" />
</svelte:head>

<div transition:slide>
	<MaterialAppMin>
		<ProgressLinear
			bind:this="{progress}"
			backgroundColor="secondary-color"
			color="secondary-color"
		/>
		<Appbar
			loading="{$loading}"
			bind:search="{searchText}"
			desktop="{$is_desktop}"
			search_bar
		/>
		<Carousel desktop="{$is_desktop}" slides="{slides}" />
		<main class="main">
			{#if mode == 'display'}
				<Cards px="{$is_desktop ? 44 : 16}">
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
				<Cards px="{$is_desktop ? 44 : 16}">
					{#if $loading}
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
			<Featured
				layout="{$is_desktop ? 'column' : 'row'}"
				px="{$is_desktop ? 44 : 16}"
				gap="{24}"
			/>
		</main>
		<Footer desktop="{$is_desktop}" />
	</MaterialAppMin>
</div>
