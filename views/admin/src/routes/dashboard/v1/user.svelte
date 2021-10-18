<script context="module" lang="ts">
	import { onMount, getContext } from 'svelte';
	import { slide } from 'svelte/transition';

	import { Currency } from '$lib/helper';

	import SideBar from '../_side-bar.svelte';
	import AppBar from '../_app-bar.svelte';
	import Main from '../_main.svelte';
	import Footer from '../_footer.svelte';
	import Progress from '$components/progress.svelte';

	import { base } from '$app/paths';
	import { goto } from '$app/navigation';

	import type { ClientApi, User } from '../__layout.svelte';

	const title = 'Total User';
	const desc = 'Dashboard';
</script>

<script lang="ts">
	const client = getContext<ClientApi>('clientApi');
	const user = getContext<User>('user');

	let mode: 'light' | 'dark' = 'dark';
	let opened = true;
	let profile = { image: '', name: '', role: '' };
	let loader: Progress;
  let data: ClientApi.Buyer[] = [];
	// let fake = Array(4);
	// let stat: ClientApi.Admin.Stat;

	onMount(async () => {
		try {
			if (!user.get()) {
				return goto(base + '/');
			}
			await client.ready;
      data = await client.buyer.searchMany({});
			// stat = await client.admin.stat();
			// fake = Array(0);
			profile = {
				image: $user?.image as any,
				name: $user?.username as any,
				role: $user?.role as any
			};
			// const event = client.admin.event();
			// event.addEventListener('message', async (event) => {
			// 	stat = await client.admin.stat();
			// });
			// await event.open;
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

<section
	transition:slide
	data-theme={mode}
	class="{mode} grid grid-flow-col grid-cols-[2.5fr,9.5fr] bg-base-100"
>
	<SideBar show={opened} />
	<section class="flex flex-col">
		<AppBar bind:mode bind:opened account={profile} />
		<Progress bind:this={loader} />
		<Main>
			<section>
				<div class="text-3xl text-base-content font-bold">{title}</div>
			</section>
			<!-- <ul class="grid gap-4">
				{#each fake as value}
					<li>
						<a href="?">
							<section class="py-3 px-4 rounded bg-base-200">
								<div class="flex">
									<img class="w-6 h-6 rounded-full animate-pulse" src="" alt="" />
									<div>
										<div />
									</div>
								</div>
							</section>
						</a>
					</li>
				{/each}
			</ul> -->
			<div class="overflow-x-auto">
				<table class="table w-full">
					<thead>
						<tr>
							<th>
								<label>
									<input type="checkbox" class="checkbox" />
								</label>
							</th>
							<th>Name</th>
							<th>Job</th>
							<th>Favorite Color</th>
							<th />
						</tr>
					</thead>
					<tbody>
						<tr>
							<th>
								<label>
									<input type="checkbox" class="checkbox" />
								</label>
							</th>
							<td>
								<div class="flex items-center space-x-3">
									<div class="avatar">
										<div class="w-12 h-12 mask mask-squircle">
											<img
												src="/tailwind-css-component-profile-2@56w.png"
												alt="Avatar Tailwind CSS Component"
											/>
										</div>
									</div>
									<div>
										<div class="font-bold">Hart Hagerty</div>
										<div class="text-sm opacity-50">United States</div>
									</div>
								</div>
							</td>
							<td>
								Zemlak, Daniel and Leannon

								<br />
								<span class="badge badge-outline badge-sm">Desktop Support Technician</span>
							</td>
							<td>Purple</td>
							<th>
								<button class="btn btn-ghost btn-xs">details</button>
							</th>
						</tr>
						<tr>
							<th>
								<label>
									<input type="checkbox" class="checkbox" />
								</label>
							</th>
							<td>
								<div class="flex items-center space-x-3">
									<div class="avatar">
										<div class="w-12 h-12 mask mask-squircle">
											<img
												src="/tailwind-css-component-profile-3@56w.png"
												alt="Avatar Tailwind CSS Component"
											/>
										</div>
									</div>
									<div>
										<div class="font-bold">Brice Swyre</div>
										<div class="text-sm opacity-50">China</div>
									</div>
								</div>
							</td>
							<td>
								Carroll Group

								<br />
								<span class="badge badge-outline badge-sm">Tax Accountant</span>
							</td>
							<td>Red</td>
							<th>
								<button class="btn btn-ghost btn-xs">details</button>
							</th>
						</tr>
						<tr>
							<th>
								<label>
									<input type="checkbox" class="checkbox" />
								</label>
							</th>
							<td>
								<div class="flex items-center space-x-3">
									<div class="avatar">
										<div class="w-12 h-12 mask mask-squircle">
											<img
												src="/tailwind-css-component-profile-4@56w.png"
												alt="Avatar Tailwind CSS Component"
											/>
										</div>
									</div>
									<div>
										<div class="font-bold">Marjy Ferencz</div>
										<div class="text-sm opacity-50">Russia</div>
									</div>
								</div>
							</td>
							<td>
								Rowe-Schoen

								<br />
								<span class="badge badge-outline badge-sm">Office Assistant I</span>
							</td>
							<td>Crimson</td>
							<th>
								<button class="btn btn-ghost btn-xs">details</button>
							</th>
						</tr>
						<tr>
							<th>
								<label>
									<input type="checkbox" class="checkbox" />
								</label>
							</th>
							<td>
								<div class="flex items-center space-x-3">
									<div class="avatar">
										<div class="w-12 h-12 mask mask-squircle">
											<img
												src="/tailwind-css-component-profile-5@56w.png"
												alt="Avatar Tailwind CSS Component"
											/>
										</div>
									</div>
									<div>
										<div class="font-bold">Yancy Tear</div>
										<div class="text-sm opacity-50">Brazil</div>
									</div>
								</div>
							</td>
							<td>
								Wyman-Ledner

								<br />
								<span class="badge badge-outline badge-sm">Community Outreach Specialist</span>
							</td>
							<td>Indigo</td>
							<th>
								<button class="btn btn-ghost btn-xs">details</button>
							</th>
						</tr>
					</tbody>
					<tfoot>
						<tr>
							<th />
							<th>Name</th>
							<th>Job</th>
							<th>Favorite Color</th>
							<th />
						</tr>
					</tfoot>
				</table>
			</div>



			<section class="flex gap-4 !text-base-content">
				<div class="btn-group">
					<button class="btn bg-base-200 hover:bg-base-300">
						<svg
							class="w-6 h-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
							/></svg
						>
					</button>
					<button class="btn bg-base-200 hover:bg-base-300">
						<svg
							class="w-6 h-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
							/></svg
						>
					</button>
					<button class="btn bg-base-200 hover:bg-base-300">
						<svg
							class="w-6 h-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"
							/></svg
						>
					</button>
				</div>
				<div class="btn-group">
					<button class="btn bg-base-200">
						<svg
							class="w-6 h-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 6v6m0 0v6m0-6h6m-6 0H6"
							/></svg
						>
					</button>
					<button class="btn bg-base-200">
						<svg
							class="w-6 h-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M20 12H4"
							/></svg
						>
					</button>
				</div>
				<div class="btn-group">
					<button class="btn bg-base-200">
						<svg
							class="w-6 h-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							/></svg
						>
					</button>
					<button class="btn bg-base-200">
						<svg
							class="w-6 h-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/></svg
						>
					</button>
					<!-- <button class="btn bg-base-200">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							class="inline-block w-4 stroke-current"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
							/>
						</svg>
					</button> -->
				</div>
				<div class="flex-grow" />
				<div class="btn-group">
					<button class="btn bg-base-200">
						<svg
							class="w-6 h-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 19l-7-7 7-7"
							/></svg
						>
					</button>
					<button class="btn text-lg btn-active">1</button>
					<button class="btn text-lg bg-base-200">2</button>
					<button class="btn text-lg bg-base-200">3</button>
					<button class="btn bg-base-200">
						<svg
							class="w-6 h-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 5l7 7-7 7"
							/></svg
						>
					</button>
				</div>
			</section>
			<table class="table w-full rounded-md overflow-hidden ">
				<thead>
					<tr>
						<th class="!rounded-none !bg-base-300">
							<label>
								<input
									type="checkbox"
									class="checkbox checkbox-sm checkbox-primary bg-transparent border-base-100 border-2"
								/>
							</label>
						</th>
						<!-- <th class="!rounded-none !bg-base-300">
							<div class="flex items-center gap-1">
								<div>#ID</div>
								<div class="flex-grow" />
								<button class="btn btn-ghost btn-xs btn-square">
									<svg
										class="w-4 h-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										xmlns="http://www.w3.org/2000/svg"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M19 9l-7 7-7-7"
										/></svg
									>
								</button>
							</div>
						</th> -->
						<th class="!rounded-none !bg-base-300">
							<div class="flex items-center gap-1">
								<div>Username</div>
								<div class="flex-grow" />
								<button class="btn btn-ghost btn-xs btn-square">
									<svg
										class="w-4 h-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										xmlns="http://www.w3.org/2000/svg"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M19 9l-7 7-7-7"
										/></svg
									>
								</button>
							</div>
						</th>
						<th class="!rounded-none !bg-base-300">
							<div class="flex items-center gap-1">
								<div>Email</div>
								<div class="flex-grow" />
								<button class="btn btn-ghost btn-xs btn-square">
									<svg
										class="w-4 h-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										xmlns="http://www.w3.org/2000/svg"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M19 9l-7 7-7-7"
										/></svg
									>
								</button>
							</div>
						</th>
						<th class="!rounded-none !bg-base-300">
							<div class="flex items-center gap-1">
								<div>Image</div>
								<div class="flex-grow" />
								<button class="btn btn-ghost btn-xs btn-square">
									<svg
										class="w-4 h-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										xmlns="http://www.w3.org/2000/svg"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M19 9l-7 7-7-7"
										/></svg
									>
								</button>
							</div>
						</th>
					</tr>
				</thead>
				<tbody>
					{#each data as item}
						<tr class="border-t-2 !border-gray-600">
							<th class="!bg-base-200">
								<label class="flex">
									<input
										type="checkbox"
										class="checkbox checkbox-sm checkbox-primary bg-transparent border-base-100 border-2"
									/>
								</label>
							</th>
							<!-- <td class="relative !bg-base-200">{item.id}</td> -->
							<td class="!bg-base-200">{item.username}</td>
							<td class="!bg-base-200">{item.email}</td>
							<td class="!bg-base-200">{item.image}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</Main>
		<dir class="flex-grow" />
		<Footer />
	</section>
</section>

<style lang="scss"></style>
