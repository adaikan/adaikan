<script context="module" lang="ts">
	import { onMount, getContext } from 'svelte';
	import { fade } from 'svelte/transition';
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';

  import logo from '$static/logo.png';

	import type { ClientApi, User } from './__layout.svelte';
</script>

<script lang="ts">
	const client = getContext<ClientApi>('clientApi');
	const user = getContext<User>('user');
	const progress = tweened(10, {
		duration: 250,
		easing: cubicOut
	});
	let isError = false;

  export let success = false;
  export let failed = false;

	onMount(async () => {
		try {
      $progress = 30;
			await client.ready;
      $progress = 50;
			const result = await client.internal.auth();
      $progress = 70;
      user.set(result);
      $progress = 90;
      setTimeout(() => {
        $progress = 100;
        success = true;
      }, 500);
		} catch (error: any) {
			failed = true;
		}
	});
</script>

<section transition:fade class="page place-content-center bg-base-100">
	<section class="w-[180px] grid gap-10 bg-transparent rounded-md px-4 py-6">
		<img src={logo} alt="" width="72" height="72" class="justify-self-center" />
		<progress
			value={$progress}
			max="100"
			class="progress bg-base-200 transition-all {failed ? 'progress-error' : 'progress-primary'}"
		/>
	</section>
</section>
