<script context="module" lang="ts">
	import Progress from '$components/progress.svelte';

	import { fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import Script from './index';
</script>

<script lang="ts">
	const script = new Script();
	const { progress, success, error } = script;

	$: handleSuccess($progress);
	$: handleError($error);

	function handleSuccess(tag: any) {
		if ($success) {
			goto(base + '/dashboard');
		}
	}
	function handleError(error: string) {
		if (error == script.ERROR.UNAUTH) {
			goto(base + '/signup');
		}
	}
</script>

<section transition:fade class="page place-content-center bg-base-100">
	<section class="w-[180px] grid gap-10 bg-transparent rounded-md px-4 py-6">
		<img src={script.logo} alt="" width="72" height="72" class="justify-self-center" />
		<progress
			value={$progress}
			max="100"
			class="progress bg-base-200 transition-all {$error ? 'progress-error' : 'progress-primary'}"
		/>
	</section>
</section>

<style></style>
