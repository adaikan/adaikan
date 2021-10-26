<script context="module" lang="ts">
	import { onMount, getContext } from 'svelte';

	import Page from '$components/page.svelte';
	import Splash from './_splash.svelte';

	import { goto } from '$app/navigation';

	import type { ClientApi, User } from '../__layout.svelte';
</script>

<script lang="ts">
	const client = getContext<ClientApi>('clientApi');
	const user = getContext<User>('user');
	let success = false;
	let e_type: any = '';

	$: {
		if (e_type) {
			if (e_type == client.stdApi.Error.FailedAuthentication.type) {
				goto('/admin/signup');
			}
		}
	}
</script>

{#if success}
	<slot />
{:else}
	<Page class="text-gray-900 bg-gray-50 dark:text-gray-50 dark:bg-gray-900">
		<Splash bind:error_type={e_type} bind:success />
	</Page>
{/if}

<style lang="scss">
</style>
