<script context="module" lang="ts">
	import { onMount, onDestroy, getContext } from 'svelte';
	import { fade } from 'svelte/transition';

	import Page from '$components/page.svelte';
	import Appbar from '$components/appbar.svelte';
	import Drawer, { slide } from '$components/drawer.svelte';
	import Content from '$components/content.svelte';
	import Main from '$components/main.svelte';
	import Footer from '$components/footer.svelte';
	import Progress from '$components/progress.svelte';
	import AppbarContent from './_appbar.svelte';
	import DrawerContent from './_drawer.svelte';
	import FooterContent from './_footer.svelte';
	import Stat from './_stat.svelte';

	import { goto } from '$app/navigation';

	import type { ClientApi, User } from '../__layout.svelte';

	const title = 'Dashboard';
	const desc = '';
</script>

<script lang="ts">
	const client = getContext<ClientApi>('clientApi');
	const user = getContext<User>('user');
	const event = client.admin.event;

	let mode = 'dark';
	let drawerOpened = true;
	let user_login = $user;
	let account = { image: '', name: '', role: '' };
	let progress: Progress;

	let stat: ClientApi.Admin.Stat;

	onMount(init);
	onDestroy(release);

	async function init() {
		try {
			await client.ready;

			if (!user_login) {
				return goto('/admin', {replaceState: true});
			}
			
			account = {
				image: user_login.image ?? '',
				name: user_login.username,
				role: user_login.role
			};
			stat = await client.admin.stat();

			await event.open();

			event.addEventListener('message', async (event) => {
				stat = await client.admin.stat();
			});
		} catch (error: any) {
			console.error(error);
		} finally {
			progress.hiding();
		}
	}
	async function release() {
		try {
			event.close();
		} catch (error: any) {
			console.error(error);
		} finally {
		}
	}
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={desc} />
</svelte:head>

<Page {mode} class="text-gray-900 bg-gray-50 dark:text-gray-50 dark:bg-gray-900">
	<section transition:fade class="flex">
		<Drawer show={drawerOpened} class="bg-base-100">
			<DrawerContent />
		</Drawer>
		<Content class="flex-grow">
			<Appbar class="bg-base-100">
				<AppbarContent bind:account bind:mode bind:drawerOpened />
			</Appbar>
			<Progress bind:this={progress} />
			<Main>
				<section>
					<div class="text-2xl font-bold">{title}</div>
				</section>
				<section class="grid grid-cols-4 gap-4">
					<Stat {stat} />
				</section>
			</Main>
			<div class="flex-grow" />
			<Footer class="bg-base-100 justify-center">
				<FooterContent />
			</Footer>
		</Content>
	</section>
</Page>

<style lang="scss">
</style>
