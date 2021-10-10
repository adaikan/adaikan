<script context="module" lang="ts">
	import { onMount, getContext } from 'svelte';
	import { slide } from 'svelte/transition';

	import SideBar from '../_side-bar.svelte';
	import AppBar from '../_app-bar.svelte';
	import Main from '../_main.svelte';
	import Footer from '../_footer.svelte';
	import Progress from '$components/progress.svelte';

	import type { ClientApi, User } from '../__layout.svelte';

	const name = 'Setting';
	const title = 'Setting';
	const desc = 'Setting';
</script>

<script lang="ts">
	const client = getContext<ClientApi>('clientApi');
	const user = getContext<User>('user');

	let notification = false;

	let loader: Progress;

	onMount(async () => {
		try {
			await client.ready;
			notification  = Notification.permission == 'granted' ? true : false;
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

<section class="grid grid-flow-col grid-cols-[2.5fr,9.5fr] bg-gray-200 dark:bg-gray-800">
	<SideBar />
	<section class="flex flex-col">
		<AppBar />
		<Progress bind:this={loader} />
		<Main>
			<section>
				<div class="text-white text-3xl font-bold">{name}</div>
			</section>
			<form class="grid bg-base-200 p-6 rounded-lg">
				<div class="grid gap-12 w-[320px] justify-self-center">
					<div class="grid gap-4">
						<div class="form-control">
							<label class="cursor-pointer label">
								<span class="label-text">Notification</span>
								<input checked={notification} type="checkbox" class="toggle toggle-primary" />
							</label>
						</div>
						<div class="form-control">
							<label class="cursor-pointer label">
								<span class="label-text">Multifactor Authentication</span>
								<input type="checkbox" class="toggle toggle-primary" />
							</label>
						</div>
						<div class="form-control">
							<label class="cursor-pointer label">
								<span class="label-text">Installed</span>
								<input type="checkbox" class="toggle toggle-primary" />
							</label>
						</div>
					</div>
					<button class="btn btn-primary">Save</button>
				</div>
			</form>
		</Main>
		<dir class="flex-grow"></dir>
		<Footer />
	</section>
</section>

<style lang="scss"></style>
