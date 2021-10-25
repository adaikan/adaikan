<script context="module" lang="ts">
	import { onMount, getContext } from 'svelte';

	import Progress from '$components/progress.svelte';

	import { goto } from '$app/navigation';

	import type { ClientApi, User } from '../__layout.svelte';

	const title = 'Logout';
	const desc = 'Logging Out';
</script>

<script lang="ts">
	const client = getContext<ClientApi>('clientApi');
	const user = getContext<User>('user');

	let loader: Progress;

	onMount(async () => {
		try {
			await client.ready;
			await client.internal.token.remove();
			goto('/admin', { replaceState: true });
		} catch (error: any) {
			console.error(error);
		} finally {
			loader.hiding();
		}
	});
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={desc} />
</svelte:head>

<Progress bind:this={loader} />
