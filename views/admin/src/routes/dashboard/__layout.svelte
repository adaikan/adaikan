<script context="module" lang="ts">
	import { onMount, getContext } from 'svelte';

	import Page from '$components/page.svelte';
	import Splash from './_splash.svelte';

	import { goto } from '$app/navigation';
	import { base } from '$app/paths';

	import type { ClientApi, User } from '../__layout.svelte';
</script>

<script lang="ts">
	const client = getContext<ClientApi>('clientApi');
	const user = getContext<User>('user');
	let e_type: any = '';

	$: {
		if (e_type) {
			if (e_type == client.stdApi.Error.FailedAuthentication.type) {
				goto(base + '/signup');
			}
		}
	}
</script>

{#if $user}
	<slot />
{:else}
	<Page class="text-gray-900 bg-gray-50 dark:text-gray-50 dark:bg-gray-900">
		<Splash bind:error_type={e_type} />
	</Page>
{/if}

<style lang="scss">
</style>
