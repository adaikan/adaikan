<script context="module" lang="ts">
	import {
		AppBar,
		Button,
		Icon,
		Dialog,
		Card,
		CardActions,
		CardSubtitle,
		CardText,
		CardTitle,
	} from 'svelte-materialify/src';
	import { mdiChevronLeft } from '@mdi/js';

	import { goto } from '$app/navigation';

	import { setContext, getContext, onMount, onDestroy } from 'svelte';
	import { readable, writable } from 'svelte/store';
</script>

<script lang="ts">
	export let active = false;
	onMount(init);
	onDestroy(release);
	function init() {}
	function release() {}
</script>

<Dialog bind:active persistent>
	<Card>
		<CardTitle>Perhatian!</CardTitle>
		<CardText
			>Sebelum menerima pesanan dan melakukan pengantran, terlebih dahulu harus
			mengatur kontak dan lokasi</CardText>
		<section class="s-card-actions">
			<Button
				class="primary-color"
				on:click="{() => goto('/courier/account/profile')}">Atur</Button>
		</section>
	</Card>
</Dialog>

<slot />

<style lang="scss">
	.s-card-actions {
		align-items: center;
		display: flex;
		padding: 16px 24px;
	}
</style>
