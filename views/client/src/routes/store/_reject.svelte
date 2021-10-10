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
	import { createEventDispatcher } from 'svelte';

	const event = createEventDispatcher<{ decision: 'yes' | 'no' | 'none' }>();

	export let active = false;

	let decision = '';

	$: update(active);

	function update(tag: any) {
		if (!active && !decision) {
			event('decision', 'none');
		} else {
			decision = '';
		}
	}
</script>

<Dialog bind:active>
	<Card>
		<CardTitle>Perhatian</CardTitle>
		<CardText>Apakah anda ingin menolak pesanan.</CardText>
		<CardActions>
			<Button
				on:click="{() => {
					event('decision', (decision = 'yes'));
					setTimeout(() => {
						active = false;
					}, 500);
				}}"
				text
				class="error-text">Ya</Button>
			<Button
				on:click="{() => {
					event('decision', (decision = 'no'));
					setTimeout(() => {
						active = false;
					}, 500);
				}}"
				text
				class="">Tidak</Button>
		</CardActions>
	</Card>
</Dialog>
