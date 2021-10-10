<script context="module" lang="ts">
	import { Icon, Card } from 'svelte-materialify/src';
	import { mdiImageRemove, mdiImageBrokenVariant } from '@mdi/js';

	import { onMount, onDestroy } from 'svelte';
	import { writable } from 'svelte/store';
	import { fade } from 'svelte/transition';
	import { browser, dev } from '$app/env';
	import { goto } from '$app/navigation';
	import { assets } from '$app/paths';
	import { page } from '$app/stores';
	import { Currency, toMoney } from '$lib/helper';

	interface Data {
		name?: string;
		image?: string;
		price?: any;
		store?: string;
	}
</script>

<script lang="ts">
	export let data: Data | undefined = undefined;
	export let mode: 'fetch' | 'img' = 'img';
	export let imageLoader = (url: string) => Promise.resolve('');

	$: image = data?.image;

	onMount(init);
	onDestroy(release);
	async function init() {}
	function release() {}
</script>

<figure class="card" transition:fade>
	{#if data}
		{#if mode == 'img'}
			{#if image}
				<img
					class="img"
					src="{image}"
					alt="{data.name}"
					decoding="async"
					async
					on:error="{() => {
						image = undefined;
					}}" />
			{:else}
				<div class="img e">
					<Icon size="{56}" path="{mdiImageRemove}" />
				</div>
			{/if}
		{:else if mode == 'fetch'}
			{#if data.image}
				{#await imageLoader(data.image)}
					<div class="img loading"></div>
				{:then url}
					<img class="img" src="{url}" alt="{data.name}" />
				{:catch e}
					<div class="img e">
						<Icon size="{56}" path="{mdiImageRemove}" />
					</div>
				{/await}
			{:else}
				<div class="img e">
					<Icon size="{56}" path="{mdiImageRemove}" />
				</div>
			{/if}
		{/if}
		<figcaption class="content">
			<div class="name">{data.name}</div>
			<div class="store">{data.store}</div>
			<div class="price">
				Rp. {Currency.toMoney(data.price)}
			</div>
		</figcaption>
	{:else}
		<div class="img loading">&nbsp;</div>
		<figcaption class="content">
			<div class="name loading">&nbsp;</div>
			<div class="store loading">&nbsp;</div>
			<div class="price loading">&nbsp;</div>
		</figcaption>
	{/if}
</figure>

<style lang="scss">
	@import '../components/skeleton';
	@import '../components/elevation';
	.loading {
		@include loading-sekeleton;
	}
	.card {
		@include elevation;
		display: grid;
		border-radius: 4px;
		.img {
			object-fit: cover;
			object-position: center;
			width: 100%;
			aspect-ratio: 1;
			background-color: #f5f5f5;
			border-radius: 4px;
			&.e {
				display: grid;
				place-items: center;
				opacity: 0.7;
			}
		}
		.content {
			padding: 8px;
			display: grid;
			row-gap: 4px;
		}
		.name {
			font-size: 16px;
			font-weight: 500;
		}
		.price {
			font-size: 14px;
			font-weight: 500;
			opacity: 0.7;
		}
		.store {
			font-size: 14px;
			font-weight: 500;
			opacity: 0.7;
		}
	}
</style>
