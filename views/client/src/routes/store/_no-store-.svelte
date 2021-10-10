<script lang="ts" context="module">
	import {
		Dialog,
		Card,
		CardTitle,
		CardText,
		CardActions,
		Button,
	} from 'svelte-materialify/src';
</script>

<script lang="ts">
	import { goto } from '$app/navigation';

	export let active = false;
</script>

<Dialog bind:active persistent>
	<Card>
		<CardTitle>Belum punya toko</CardTitle>
		<CardText
			>Sebelum menjual dan menerima pesanan, anda harus membuat toko terlebih
			dahulu.</CardText>
		<CardActions>
			<Button
				on:click="{() => {
					goto('/store/create');
				}}"
				text
				class="primary-text">Buat</Button>
			<Button
				on:click="{() => {
					goto('/');
				}}"
				text
				class="error-text">Keluar</Button>
		</CardActions>
	</Card>
</Dialog>
