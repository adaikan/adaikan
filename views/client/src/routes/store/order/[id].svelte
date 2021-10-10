<script context="module" lang="ts">
	import {
		MaterialAppMin,
		AppBar,
		Button,
		Icon,
		Menu,
		ListItem,
		NavigationDrawer,
		Avatar,
		List,
		ListItemGroup,
		TextField,
		Textarea,
		Subheader,
		Divider,
		Overlay,
		Card,
		Chip,
		Footer,
		Badge,
		CardActions,
		CardSubtitle,
		CardText,
		CardTitle,
	} from 'svelte-materialify/src';
	import ProgressLinear from '$components/progress-linear.svelte';
	import NoStore from '../_no-store-.svelte';
	import {
		mdiMenu,
		mdiViewDashboardOutline,
		mdiDotsVertical,
		mdiViewGridOutline,
		mdiClipboardTextOutline,
		mdiCached,
		mdiCheck,
		mdiTruckOutline,
		mdiStorefrontOutline,
		mdiCubeOutline,
		mdiFishbowlOutline,
		mdiAccountOutline,
		mdiRefresh,
		mdiMessageTextOutline,
		mdiChevronLeft,
	} from '@mdi/js';
	import { mdiClipboardTextClockOutline } from '$lib/icons';
	import CartCard from '$components/cart-card.svelte';
	import RejectDialog from '../_reject.svelte';
	import Snackbar from '$components/snackbar.svelte';

	import { onMount, onDestroy, getContext } from 'svelte';
	import { fade, slide, scale } from 'svelte/transition';
	import { writable, derived } from 'svelte/store';
	import { dev } from '$app/env';
	import { goto } from '$app/navigation';
	import { Currency } from '$lib/helper';

	import type { SellerClientApi } from '../__layout.svelte';

	const title = 'Pesanan';
</script>

<script lang="ts">
	import { page, navigating } from '$app/stores';

	let client = getContext<SellerClientApi>('seller');
	let order: SellerClientApi.Order & {
		buyer: SellerClientApi.Buyer;
		item: (SellerClientApi.OrderedItem & {
			product: SellerClientApi.Product;
		})[];
		delivery: SellerClientApi.Delivery & {
			recipient: SellerClientApi.BuyerAddress;
		};
	};
	let isLoading = writable(true);
	let user: SellerClientApi.Seller;
	let loader: ProgressLinear;
	let rejectDialog: RejectDialog;
	let snackbar: Snackbar;
	let noStore: NoStore;
	let contact: { name: string; telp: string; node: number }[] = [];

	$: isLoading = loader?.active;
	$: {
		if ($navigating) {
			loader.loading();
		}
	}

	onMount(init);
	onDestroy(release);

	async function init() {
		try {
			await client.ready;
			user = await client.seller.auth();

			if (!user.storeId) {
				throw new Error('No store');
			}

			order = await client.order.search({
				where: {
					AND: [
						{ id: +$page.params.id },
						{ status: { in: ['Queue', 'Reject'] } },
					],
				},
				include: {
					buyer: true,
					item: { include: { product: true } },
					delivery: { include: { recipient: true } },
				},
				rejectOnNotFound: true,
			});

			contact = [
				{
					name: 'Penerima',
					telp: order.delivery.recipient.telp,
					node: order.buyer.chatNodeId,
				},
			];

			rejectDialog.$on('decision', (event) => {
				if (event.detail == 'yes') {
					reject();
				}
			});
		} catch (error: any) {
			if (error.message == 'No store') {
				noStore.$set({ active: true });
			}
		} finally {
			loader.loaded();
		}
	}
	function release() {}
	function toMoney(value: any) {
		return Currency.toMoney(value);
	}
	async function accept() {
		try {
			loader.loading();
			await client.order.update({
				where: { id: order.id },
				data: {
					status: 'Process',
				},
			});
			snackbar.setText('Pesanan disetujui');
			snackbar.show();
			await loader.sequencing();
			goto('/store', { replaceState: true });
		} catch (error: any) {
			snackbar.setText(error.message);
			snackbar.show();
		} finally {
			loader.loaded();
		}
	}
	async function reject() {
		try {
			loader.loading();
			await client.order.update({
				where: { id: order.id },
				data: {
					status: 'Reject',
				},
			});
			snackbar.setText('Pesanan ditolak');
		} catch (error: any) {
			snackbar.setText(error.message);
		} finally {
			snackbar.show();
			loader.loaded();
		}
	}
	function requesReject() {
		rejectDialog.$set({ active: true });
	}
	function toDate(value: any) {
		if (value) {
			return new Date(value).toLocaleString();
		} else {
			return '---';
		}
	}
	async function downloader(src: string) {
		return URL.createObjectURL(await client.product.downloadImage(src));
	}
</script>

<style lang="scss">
	@import '../../../components/common';
	@import '../../../components/skeleton';
	@import '../../../components/elevation';
	.loading {
		@include loading-sekeleton;
	}
	.card {
		@include elevation;
		border-radius: 6px;
	}
	main {
		padding: 24px 0;
		@include main;
	}
	form {
		display: grid;
		row-gap: 24px;
	}
	fieldset {
		border: none;
		display: grid;
		row-gap: 8px;
	}
	.btn {
		width: stretch;
		height: stretch;
		display: grid;
		grid-template-columns: min-content 2fr 2fr;
		grid-auto-flow: column;
		align-items: center;
		column-gap: 8px;
	}
	* :global {
		.div {
			display: grid;
			row-gap: 24px;
		}
		.section {
			display: grid;
			row-gap: 16px;
		}
		.subsection {
			display: grid;
			row-gap: 8px;
		}
		.column {
			display: grid;
			grid-auto-flow: column;
			grid-template-columns: 1fr 1fr;
			column-gap: 16px;
			align-items: center;
			justify-content: space-between;
			.start {
				justify-self: start;
			}
			.end {
				justify-self: end;
			}
		}
		.hr {
			display: block;
			height: 1px;
			width: stretch;
			background-color: #efefef;
			border: none;
		}
		.textfield {
			min-height: 48px;
		}
		.t-20 {
			font-size: 20px;
			line-height: normal;
		}
		.t-16 {
			font-size: 16px;
			line-height: normal;
		}
		.t-14 {
			font-size: 14px;
			line-height: normal;
		}
		.t-500 {
			font-weight: 500;
		}
		.t-400 {
			font-weight: 400;
		}
		.o-7 {
			opacity: 0.7;
		}
		.o-9 {
			opacity: 0.9;
		}
		.p-16 {
			padding: 16px;
		}
		.px-16 {
			padding: {
				left: 16px;
				right: 16px;
			}
		}
		.py-16 {
			padding: {
				top: 16px;
				bottom: 16px;
			}
		}
		@include common-loader;
		@include common-app {
			background-color: #f7f7f7;
		}
		@include common-appbar;
		@include common-footer;
		.list {
			display: grid;
			gap: 16px;
			.s-badge {
				width: 100%;
			}
			.s-list-item__title,
			.s-list-item__subtitle {
				line-height: 1.5;
			}
		}
	}
</style>

<svelte:head>
	<title>{title}</title>
	<meta name="" content="" />
</svelte:head>

<div transition:slide>
	<MaterialAppMin>
		<ProgressLinear bind:this="{loader}" />
		<AppBar class="primary-color {$isLoading ? 'top-4' : ''}">
			<div slot="icon">
				<Button
					text
					fab
					size="small"
					depressed
					on:click="{() => history.back()}"
				>
					<Icon path="{mdiChevronLeft}" />
				</Button>
			</div>
			<div slot="title">{title}</div>
		</AppBar>
		<main>
			<form autocomplete="off">
				{#if order}
					<fieldset class="card p-16 section white">
						<div>
							<Chip label>Menunggu</Chip>
						</div>
						<hr class="hr" />
						<section class="subsection">
							<div class="column t-14 t-400">
								<span class="o-7">Tanggal Buat</span>
								<span class="end">{toDate(order.createOn)}</span>
							</div>
							<div class="column t-14 t-400">
								<span class="o-7">Tanggal Selesai</span>
								<span class="end">{toDate(order.finishOn)}</span>
							</div>
						</section>
					</fieldset>
					<fieldset class="card div p-16 white">
						<div class="t-16 t-500 o-9">Penerima</div>
						<section class="section">
							<TextField
								value="{order.delivery.recipient.name ?? ''}"
								readonly
								placeholder="-">Nama</TextField
							>
							<TextField
								value="{order.delivery.recipient.telp ?? ''}"
								readonly
								placeholder="-">Phone Number</TextField
							>
							<Textarea
								value="{order.delivery.recipient.value}"
								readonly
								placeholder="-"
								autogrow
								rows="{3}">Alamat</Textarea
							>
						</section>
					</fieldset>
					<fieldset class="card p-16 white">
						<div class="t-16 t-500 o-9">Daftar Pesanan</div>
						<section class="section">
							{#each order.item as item}
								<CartCard
									outlined
									control="{false}"
									loading="{false}"
									downloader="{downloader}"
									image="{item.product.image}"
									amount="{item.amount}"
									data="{{
										name: item.product.name,
										price: item.price,
									}}"
								/>
							{/each}
						</section>
					</fieldset>
					<fieldset class="card p-16 section white">
						<div class="t-16 t-500 o-9">Rincian Pembayaran</div>
						<hr class="hr" />
						<section class="subsection">
							<div class="column t-14 t-400">
								<span class="o-7">Metode Pembayaran</span>
								<span class="end">Bayar Tunai</span>
							</div>
							<div class="column t-14 t-400">
								<span class="o-7"
									>Total Harga ({order.item.length} pesanan)</span
								>
								<span class="end">Rp. {toMoney(order.cost)}</span>
							</div>
							<div class="column t-14 t-400">
								<span class="o-7"
									>Biaya Kirim ({Math.round(order.delivery.range)}
									{order.delivery.rangeUnit})</span
								>
								<span class="end">Rp. {toMoney(order.delivery.cost)}</span>
							</div>
						</section>
						<hr class="hr" />
						<div class="column t-16 t-500">
							<span class="">Total Bayar</span>
							<span class="end"
								>Rp. {toMoney(+order.delivery.cost + +order.cost)}</span
							>
						</div>
					</fieldset>
				{:else}
					<fieldset class="card p-16 white section">
						<div class="t-16 loading">&nbsp;</div>
						<section class="section">
							<div class="textfield loading">&nbsp;</div>
							<div class="textfield loading">&nbsp;</div>
						</section>
					</fieldset>
					<fieldset class="card p-16 white section">
						<div class="t-16 loading">&nbsp;</div>
						<section class="section">
							<div class="textfield loading">&nbsp;</div>
							<div class="textfield loading">&nbsp;</div>
						</section>
					</fieldset>
					<fieldset class="card p-16 white">
						<div class="t-16 loading">&nbsp;</div>
						<section class="section">
							{#each Array(2) as item}
								<CartCard />
							{/each}
						</section>
					</fieldset>
					<fieldset class="card p-16 white">
						<section class="section">
							<div class="t-16 loading">&nbsp;</div>
							<section class="subsection t-16">
								<div class="loading">&nbsp;</div>
								<div class="loading">&nbsp;</div>
							</section>
						</section>
						<section class="section">
							<div class="column t-16">
								<span class="loading">&nbsp;</span>
								<span class="loading">&nbsp;</span>
							</div>
						</section>
						<section class="section">
							<div class="column t-16">
								<span class="loading">&nbsp;</span>
								<span class="loading">&nbsp;</span>
							</div>
						</section>
						<section class="section">
							<div class="column t-16">
								<span class="loading">&nbsp;</span>
								<span class="loading">&nbsp;</span>
							</div>
						</section>
					</fieldset>
				{/if}
			</form>
		</main>
		<Footer class="white elevation-5">
			<div class="btn">
				{#if order}
					<Menu closeOnClick closeOnClickOutside openOnClick bottom>
						<div slot="activator">
							<Button class="" fab text size="small">
								<Icon path="{mdiMessageTextOutline}" />
							</Button>
						</div>
						<List>
							{#each contact as item}
								<ListItem
									on:click="{() => {
										goto('/store/chat/' + item.node);
									}}"
								>
									<div>{item.name}</div>
									<div slot="subtitle">{item.telp}</div>
								</ListItem>
							{/each}
						</List>
					</Menu>
					<Button class="primary-color" on:click="{accept}">Proses</Button>
					<Button
						class="error-color error-text"
						outlined
						on:click="{requesReject}">Tolak</Button
					>
				{:else}
					<div class="loading">&nbsp;</div>
					<div class="loading">&nbsp;</div>
					<div class="loading">&nbsp;</div>
				{/if}
			</div>
		</Footer>
		<Snackbar bind:this="{snackbar}" />
		<NoStore bind:this="{noStore}" />
		<RejectDialog bind:this="{rejectDialog}" />
	</MaterialAppMin>
</div>
