<script context="module" lang="ts">
	import { onMount, onDestroy, getContext } from 'svelte';
	import { fade } from 'svelte/transition';

	import Page from '$components/page.svelte';
	import Appbar from '$components/appbar.svelte';
	import Drawer from '$components/drawer.svelte';
	import Content from '$components/content.svelte';
	import Main from '$components/main.svelte';
	import Footer from '$components/footer.svelte';
	import Progress from '$components/progress.svelte';
	import Menu from '$components/menu.svelte';
	import List from '$components/list.svelte';
	import ListItem from '$components/list-item.svelte';
	import Modal from '$components/modal.svelte';
	import Avatar from '$components/avatar.svelte';
	import AppbarContent from '../_appbar.svelte';
	import DrawerContent from '../_drawer.svelte';
	import FooterContent from '../_footer.svelte';

	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	import { Currency, Diff, wait } from '$lib/helper';

	import type { ClientApi, User } from '../../__layout.svelte';

	const title = 'Sales';
	const desc = '';
</script>

<script lang="ts">
	const client = getContext<ClientApi>('clientApi');
	const user = getContext<User>('user');

	let mode = 'dark';
	let drawerOpened = true;
	let account = { image: '', name: '', role: '' };
	let progress: Progress;

	let id = +$page.params.id;
	let sale: ClientApi.Admin.SaleDetail;
	let business: ClientApi.Admin.Data['business'];
	let copy: any = {};
	let contact: { name: string; nodeId: number }[] = [];
	let disable = true;
	let menu_chat = false;

	$: {
		if (sale) {
			const changed = Diff.object(copy, sale);
			if (changed) {
				disable = false;
			} else {
				disable = true;
			}
		}
	}

	onMount(init);

	async function init() {
		try {
			await client.ready;
			business = await client.admin.getBusiness();
			sale = await client.admin.sale(id);
			sale.createOn = new Date(sale.createOn).toISOString().slice(0, -1) as any;
			sale.finishOn = sale.finishOn
				? (new Date(sale.finishOn).toISOString().slice(0, -1) as any)
				: '';
			sale.delivery.sentOn = sale.delivery.sentOn
				? (new Date(sale.delivery.sentOn).toISOString().slice(0, -1) as any)
				: '';
			sale.delivery.receiveOn = sale.delivery.receiveOn
				? (new Date(sale.delivery.receiveOn).toISOString().slice(0, -1) as any)
				: '';
			copy = Diff.objectCopy(sale);
			contact = [
				{
					name: 'Buyer',
					nodeId: sale.buyer.chatNodeId
				},
				{
					name: 'Store',
					nodeId: sale.delivery.sender.chatNodeId
				},
				...(sale.delivery.courier
					? [
							{
								name: 'Courier',
								nodeId: sale.delivery.courier.chatNodeId
							}
					  ]
					: [])
			];
		} catch (error: any) {
		} finally {
			progress.hiding();
		}
	}
	async function release() {
		try {
		} catch (error: any) {
		} finally {
		}
	}
	async function save() {
		try {
			progress.showing();
			disable = true;

			if (!sale) throw new Error('');
		} catch (error: any) {
			disable = false;
		} finally {
			progress.hiding();
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
				<form on:submit|preventDefault={save} class="grid p-6 bg-base-100 rounded-lg">
					{#if sale}
						<div class="grid gap-12 w-[500px] justify-self-center">
							<div class="grid gap-4">
								<section class="flex flex-col gap-2 p-4 bg-base-200 rounded-md">
									<div class="flex">
										<div class="text-base font-semibold">Order</div>
										<div class="flex-grow" />
										<div class="badge badge-md badge-info">{sale.status}</div>
									</div>
									<hr class="h-[1px] border-0 opacity-10 bg-black dark:bg-white" />
									<div class="flex">
										<div class="text-sm">#ID</div>
										<div class="flex-grow" />
										<div class="text-sm">{sale.id}</div>
									</div>
									<div class="flex items-center">
										<div for="order-createat" class="text-sm">Create at</div>
										<div class="text-sm">{sale.createOn}</div>
										<button />
									</div>
									<div class="flex items-center">
										<div for="order-finishat" class="text-sm">Finish at</div>
										<div class="text-sm">{sale.finishOn}</div>
										<button />
									</div>
								</section>
								<section class="flex flex-col gap-2 p-4 bg-base-200 rounded-md">
									<div class="flex">
										<div class="text-base font-semibold">Delivery</div>
										<div class="flex-grow" />
										<div class="badge badge-md badge-info">{sale.delivery.status}</div>
									</div>
									<hr class="h-[1px] border-0 opacity-10 bg-black dark:bg-white" />
									<div class="flex">
										<div class="text-sm">#ID</div>
										<div class="flex-grow" />
										<div class="text-sm">{sale.delivery.id}</div>
									</div>
									<div class="flex items-center">
										<div for="order-sentat" class="text-sm">Sent at</div>
										<div class="text-sm">{sale.delivery.sentOn}</div>
										<button />
									</div>
									<div class="flex items-center">
										<div for="order-receiverat" class="text-sm">Receive at</div>
										<div class="text-sm">{sale.delivery.receiveOn}</div>
										<button />
									</div>
								</section>
								<section class="flex flex-col gap-2 p-4 bg-base-200 rounded-md">
									<div class="flex">
										<div class="text-base font-semibold">Recipient</div>
									</div>
									<hr class="h-[1px] border-0 opacity-10 bg-black dark:bg-white" />
									<div class="flex">
										<div class="text-sm">Name</div>
										<div class="flex-grow" />
										<div class="text-sm">
											{sale.delivery.recipient.name}
										</div>
									</div>
									<div class="flex">
										<div class="text-sm">Telp</div>
										<div class="flex-grow" />
										<div class="text-sm">
											{sale.delivery.recipient.telp}
										</div>
									</div>
									<div class="flex">
										<div class="flex-[50%] text-sm">Address</div>
										<div class="flex-[50%] text-sm text-right">
											{sale.delivery.recipient.value}
										</div>
									</div>
								</section>
								<section class="flex flex-col gap-2 p-4 bg-base-200 rounded-md">
									<div class="flex">
										<div class="text-base font-semibold">Sender</div>
									</div>
									<hr class="h-[1px] border-0 opacity-10 bg-black dark:bg-white" />
									<div class="flex">
										<div class="text-sm">Name</div>
										<div class="flex-grow" />
										<div class="text-sm">
											{sale.delivery.sender.name}
										</div>
									</div>
									<div class="flex">
										<div class="text-sm">Telp</div>
										<div class="flex-grow" />
										<div class="text-sm">
											{sale.delivery.sender.telp}
										</div>
									</div>
									<div class="flex">
										<div class="flex-[50%] text-sm">Address</div>
										<div class="flex-[50%] text-sm text-right">
											{sale.delivery.sender.address}
										</div>
									</div>
								</section>
								{#if sale.delivery.courier}
									<section class="flex flex-col gap-2 p-4 bg-base-200 rounded-md">
										<div class="flex">
											<div class="text-base font-semibold">Courier</div>
											<div class="flex-grow" />
										</div>
										<hr class="h-[1px] border-0 opacity-10 bg-black dark:bg-white" />
										<div class="flex">
											<div class="text-sm">Name</div>
											<div class="flex-grow" />
											<div class="text-sm">
												{sale.delivery.courier.name}
											</div>
										</div>
										<div class="flex">
											<div class="text-sm">Telp</div>
											<div class="flex-grow" />
											<div class="text-sm">
												{sale.delivery.courier.telp}
											</div>
										</div>
										<div class="flex">
											<div class="flex-[50%] text-sm">Address</div>
											<div class="flex-[50%] text-sm text-right">
												{sale.delivery.courier.address}
											</div>
										</div>
									</section>
								{:else}
									<section class="flex flex-col gap-2 p-4 bg-base-200 rounded-md">
										<div class="flex">
											<div class="text-base font-semibold">Courier</div>
										</div>
										<hr class="h-[1px] border-0 opacity-10 bg-black dark:bg-white" />
										<button type="button" class="btn btn-sm btn-primary">Select Courier</button>
									</section>
								{/if}
								<section class="flex flex-col gap-2 p-4 bg-base-200 rounded-md">
									<div class="flex">
										<div class="text-base font-semibold">Item</div>
									</div>
									{#each sale.item as item}
										<div class="flex gap-4 p-2 border border-black/10 dark:border-white/10 rounded">
											<img
												src={item.product.image}
												alt={item.product.name}
												width="44"
												height="44"
												class="aspect-1 rounded"
											/>
											<div class="flex flex-col justify-between">
												<div class="text-sm font-semibold">{item.product.name}</div>
												<div class="text-sm">
													{item.amount} x Rp. {Currency.toMoney(item.price + '')}
												</div>
											</div>
										</div>
									{/each}
								</section>
								<section class="flex flex-col gap-2 p-4 bg-base-200 rounded-md">
									<div class="flex">
										<div class="text-base font-semibold">Payment Detail</div>
									</div>
									<hr class="h-[1px] border-0 opacity-10 bg-black dark:bg-white" />
									<div class="flex">
										<div class="text-sm">Payment Method</div>
										<div class="flex-grow" />
										<div class="text-sm">Cash</div>
									</div>
									<div class="flex">
										<div class="text-sm">Total Price ({sale.item.length} item)</div>
										<div class="flex-grow" />
										<div class="text-sm">
											Rp. {Currency.toMoney(sale.cost + '')}
										</div>
									</div>
									<div class="flex">
										<div class="text-sm">
											Total Shipping Cost ({(sale.delivery.range / 1000).toFixed(3)} km)
										</div>
										<div class="flex-grow" />
										<div class="text-sm">
											Rp. {Currency.toMoney(sale.delivery.cost + '')}
										</div>
									</div>
									<div class="flex">
										<div class="text-sm">Admin Cost</div>
										<div class="flex-grow" />
										<div
											class="text-sm {business.productPriceIncreaseActive ? '' : 'line-through'}"
										>
											Rp. {Currency.toMoney(business.productPriceIncrease)}
										</div>
									</div>
									<hr class="h-[1px] border-0 opacity-10 bg-black dark:bg-white" />
									<div class="flex">
										<div class="text-sm font-semibold">Total Pay</div>
										<div class="flex-grow" />
										<div class="text-sm font-semibold">
											Rp. {Currency.toMoney(+sale.cost + +sale.delivery.cost)}
										</div>
									</div>
								</section>
							</div>
							{#if sale.rating}
								<section class="flex flex-col gap-2 p-4 bg-base-200 rounded-md">
									<div class="flex">
										<div class="text-base font-semibold">Rating</div>
									</div>
									<hr class="h-[1px] border-0 opacity-10 bg-black dark:bg-white" />
									<div class="flex justify-center gap-1">
										{#each Array(5).fill(true, 0, sale.rating.star) as star}
											<svg
												class="w-6 h-6 {star ? 'text-warning fill-current' : ''}"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
												xmlns="http://www.w3.org/2000/svg"
												><path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
												/></svg
											>
										{/each}
									</div>
									<div class="form-control">
										<label for="comment" class="label">
											<span class="label-text">Comment</span>
										</label>
										<textarea
											id="comment"
											value={sale.rating.comment}
											readonly
											class="textarea textarea-bordered"
										/>
									</div>
								</section>
							{/if}
							<div class="flex gap-2">
								<button
									id="chat"
									type="button"
									on:click={() => (menu_chat = !menu_chat)}
									class="btn btn-square border-0 bg-base-200"
								>
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
											d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
										/></svg
									>
								</button>
								<Menu for="chat" bind:show={menu_chat} class="bg-base-300">
									{#each contact as contact}
										<ListItem>
											<button
												type="button"
												on:click={() => goto('chat/' + contact.nodeId)}
												class="w-full p-3 hover:bg-gray-400 dark:hover:bg-gray-500"
												>{contact.name}</button
											>
										</ListItem>
									{/each}
								</Menu>
								<button
									disabled={disable}
									class="btn btn-primary flex-grow {disable ? 'btn-disabled' : ''}"
								>
									Update
								</button>
							</div>
						</div>
					{:else}
						<div class="grid gap-12 w-[500px] justify-self-center">
							<div class="grid gap-4">
								<section class="flex flex-col gap-2 p-4 bg-base-200 rounded-md">
									<div class="flex gap-4">
										<div class="flex-[50%] min-h-6 bg-base-300 animate-pulse" />
										<div class="flex-[50%] min-h-6 bg-base-300 animate-pulse" />
									</div>
									<hr class="h-[1px] border-0 opacity-10 bg-black dark:bg-white" />
									<div class="flex gap-4">
										<div class="flex-[50%] min-h-6 bg-base-300 animate-pulse" />
										<div class="flex-[50%] min-h-6 bg-base-300 animate-pulse" />
									</div>
									<div class="flex gap-4">
										<div class="flex-[50%] min-h-6 bg-base-300 animate-pulse" />
										<div class="flex-[50%] min-h-6 bg-base-300 animate-pulse" />
									</div>
									<div class="flex gap-4">
										<div class="flex-[50%] min-h-6 bg-base-300 animate-pulse" />
										<div class="flex-[50%] min-h-6 bg-base-300 animate-pulse" />
									</div>
								</section>
								<section class="flex flex-col gap-2 p-4 bg-base-200 rounded-md">
									<div class="flex gap-4">
										<div class="flex-[50%] min-h-6 bg-base-300 animate-pulse" />
										<div class="flex-[50%] min-h-6 bg-base-300 animate-pulse" />
									</div>
									<hr class="h-[1px] border-0 opacity-10 bg-black dark:bg-white" />
									<div class="flex gap-4">
										<div class="flex-[50%] min-h-6 bg-base-300 animate-pulse" />
										<div class="flex-[50%] min-h-6 bg-base-300 animate-pulse" />
									</div>
									<div class="flex gap-4">
										<div class="flex-[50%] min-h-6 bg-base-300 animate-pulse" />
										<div class="flex-[50%] min-h-6 bg-base-300 animate-pulse" />
									</div>
									<div class="flex gap-4">
										<div class="flex-[50%] min-h-6 bg-base-300 animate-pulse" />
										<div class="flex-[50%] min-h-6 bg-base-300 animate-pulse" />
									</div>
								</section>
							</div>
							<button
								type="submit"
								disabled={disable}
								class="btn btn-primary {disable ? 'btn-disabled' : ''}">Save</button
							>
						</div>
					{/if}
				</form>
			</Main>
			<div class="flex-grow" />
			<Footer class="bg-base-100 justify-center">
				<FooterContent />
			</Footer>
		</Content>
	</section>
</Page>

<style lang="scss">
	.aspect-1 {
		aspect-ratio: 1;
	}
</style>
