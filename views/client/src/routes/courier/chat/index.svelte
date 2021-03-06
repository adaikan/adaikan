<script context="module" lang="ts">
	import {
		MaterialAppMin,
		AppBar,
		Button,
		Icon,
		Divider,
		TextField,
	} from 'svelte-materialify/src';
	import {
		mdiMagnify,
		mdiChevronLeft,
		mdiSendOutline,
		mdiAccountOutline,
		mdiAttachment,
	} from '@mdi/js';
	import Snackbar from '$components/snackbar.svelte';
	import ProgressLinear from '$components/progress-linear.svelte';

	import { onMount, onDestroy, getContext } from 'svelte';
	import { slide, scale } from 'svelte/transition';

	import { page } from '$app/stores';

	import logo from '$static/logo.png';

	import type { CourierClientApi } from '../__layout.svelte';
</script>

<script lang="ts">
	const client = getContext<CourierClientApi>('courier');
	const wsclient = client.chat.ws();
	let courier: CourierClientApi.Courier;
	let snackbar: Snackbar;
	let contact: CourierClientApi.Chat.Channel | undefined;
	let contacts: CourierClientApi.Chat.Channel[] = [];
	let findContacts: CourierClientApi.Chat.Channel[] = [];
	let fakeContact = Array(4);
	let connectTo = $page.query.get('connectTo');
	let progress: ProgressLinear;
	let searchText = '';
	let messageText = '';
	let sendDisable = true;
	let content: HTMLElement;
	let width = 0;
	let screen: 'desktop' | 'mobile' = 'mobile';

	$: loading = progress?.active;
	$: contact && content && scrollContent();
	$: searchText && search();
	$: {
		if (width > 600) {
			screen = 'desktop';
		} else {
			screen = 'mobile';
		}
	}

	onMount(init);
	onDestroy(release);
	async function init() {
		try {
			await client.ready;
			courier = await client.courier.auth();
			if (!courier.chatNodeId) {
				const contact = await client.chat.createContact({
					role: 'courier',
					type: 'per',
				});
				courier.chatNodeId = contact.id;
				await client.courier.update({
					where: { id: courier.id },
					data: { chatNodeId: courier.chatNodeId },
				});
				snackbar.setText('Berhasil membuat kontak');
				snackbar.show();
			}
			connectTo &&
				(await client.chat.connectContact({
					myId: courier.chatNodeId,
					theirId: +connectTo,
				}));
			contacts = await client.chat.getContacts({
				nodeId: courier.chatNodeId,
			});
			fakeContact = Array(0);
			wsclient.connect({ nodeId: courier.chatNodeId, channel: contacts });
			wsclient.onMessage((message) => {
				if (contact && contact.id == message.channelId) {
					contact.message.push(message);
					contact = contact;
				} else {
					contacts
						.find((contact) => contact.id == message.channelId)
						?.message.push(message);
					contacts = contacts;
				}
				if (
					document.visibilityState == 'hidden' &&
					Notification.permission == 'granted'
				) {
					const notification = new Notification(message.sender.name, {
						body: message.text,
						badge: logo,
						icon: logo,
						tag: message.channelId + '',
						renotify: true,
					});
					notification.addEventListener('click', (event) => {
						window.focus();
					});
				}
			});
			wsclient.onJoin((channel) => {
				contacts.push(channel);
				wsclient.connect({ nodeId: courier.chatNodeId, channel: [channel] });
				contacts = contacts;
				snackbar.setText('Terdapat Kontak Baru');
				snackbar.show();
			});
			wsclient.onClose(() => {
				snackbar.setText('Koneksi Mati');
				snackbar.show();

				sendDisable = true;
			});

			Notification.requestPermission((permission) => {});
		} catch (error: any) {
			snackbar.setText(error.message);
			snackbar.show();
		} finally {
			sendDisable = false;
			progress.loaded();
		}
	}
	async function release() {
		sendDisable = false;
		wsclient.disconnect();
	}
	async function search() {
		let regex = new RegExp(searchText, 'ig');
		findContacts = contacts.filter((contact) => regex.test(contact.name));
	}
	async function send() {
		try {
			progress.loading();
			sendDisable = true;
			if (!contact) {
				throw new Error('Kontak tidak ditemukan');
			}
			await client.chat.message({
				data: {
					channelId: contact.id,
					senderId: courier.chatNodeId,
					text: messageText,
				},
			});
			messageText = '';
		} catch (error: any) {
			snackbar.setText(error.message);
			snackbar.show();
		} finally {
			sendDisable = false;
			progress.loaded();
		}
	}
	function scrollContent() {
		setTimeout(() => {
			content.scroll({
				behavior: 'smooth',
				top: content.scrollHeight,
			});
		});
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
	.thumb {
		@include image;
		width: 32px;
	}
	main {
		padding: 24px 16px;
		display: grid;
		gap: 16px;
		overflow-y: auto;
		@include main;
	}
	.desktop {
		grid-template-columns: 4fr 8fr;
	}
	.hide {
		display: none !important;
	}
	ul {
		list-style: none;
		padding-left: 0;
	}
	.search {
		margin: 12px 16px;
	}
	.list {
		display: grid;
		gap: 8px;
		padding: 8px;
		.item {
			display: flex;
			gap: 16px;
			align-items: center;
			padding: 12px 16px;
			border: 1px solid #00000032;
			border-radius: 6px;
			&:hover {
				background-color: #0000000c;
			}
		}
	}
	.desktop .message {
		.content {
			display: grid;
			align-content: start;
			.item {
				&.right {
					justify-self: end;
				}
			}
		}
		.topbar {
			gap: 24px;
		}
	}
	.message {
		display: grid;
		grid-template-rows: max-content max-content auto max-content max-content;
		overflow-y: auto;
		.topbar {
			display: flex;
			align-items: center;
			padding: 12px 16px;
			gap: 8px;
		}
		.content {
			display: flex;
			flex-flow: column nowrap;
			padding: 12px 16px;
			gap: 16px;
			overflow-y: auto;
			.item {
				width: max-content;
				max-width: 70%;
				padding: 8px 12px;
				border: 1px solid #00000032;
				border-radius: 10px 10px 10px 2px;
				&.right {
					align-self: flex-end;
					border-radius: 10px 10px 2px 10px;
				}
				&:hover {
					background-color: #0000000c;
				}
			}
		}
		.bottombar {
			display: flex;
			gap: 16px;
			align-items: center;
			padding: 12px 16px;
		}
	}
	.w-full {
		width: 100%;
	}
	* :global {
		@include common-app {
			height: 100vh;
			overflow-y: auto;
		}
		@include common-loader;
		@include common-appbar(appbar);
		@include common-footer;
		.s-input {
			label {
				opacity: 0;
			}
		}
	}
</style>

<svelte:head>
	<title>Pesan</title>
	<meta name="" content="" />
</svelte:head>

<div bind:clientWidth="{width}" transition:slide>
	<MaterialAppMin>
		<ProgressLinear
			bind:this="{progress}"
			backgroundColor="secondary-color"
			color="secondary-color"
		/>
		<AppBar class="appbar primary-color {$loading ? 'top-4' : ''}">
			<span slot="icon">
				<Button fab icon text size="small" on:click="{() => history.back()}">
					<Icon path="{mdiChevronLeft}" />
				</Button>
			</span>
			<span slot="title">Pesan</span>
		</AppBar>
		<main class="{screen}">
			<section class="card {screen == 'mobile' && contact ? 'hide' : ''}">
				<form
					autocomplete="off"
					on:submit|preventDefault="{search}"
					class="search"
				>
					<TextField
						outlined
						dense
						placeholder="Cari..."
						bind:value="{searchText}"
					>
						<div slot="prepend">
							<Button fab icon text size="small" on:click="{() => {}}">
								<Icon class="grey-text text-darken-3" path="{mdiMagnify}" />
							</Button>
						</div>
					</TextField>
				</form>
				<ul class="list">
					{#if searchText}
						{#each findContacts as item}
							<li
								class="item {item.id == contact?.id ? 'primary-color' : ''}"
								on:click="{() => {
									contact = item;
								}}"
							>
								{#if item.image}
									<img class="thumb" src="{item.image}" alt="" />
								{:else}
									<div class="thumb">
										<Icon
											class="grey-text text-darken-3"
											path="{mdiAccountOutline}"
										/>
									</div>
								{/if}
								<div class="">{item.name}</div>
							</li>
						{/each}
					{:else}
						{#each contacts as item}
							<li
								class="item {item.id == contact?.id ? 'primary-color' : ''}"
								on:click="{() => {
									contact = item;
								}}"
							>
								{#if item.image}
									<img class="thumb" src="{item.image}" alt="" />
								{:else}
									<div class="thumb">
										<Icon
											class="grey-text text-darken-3"
											path="{mdiAccountOutline}"
										/>
									</div>
								{/if}
								<div class="">{item.name}</div>
							</li>
						{/each}
					{/if}
					{#each fakeContact as any}
						<li class="item">
							<div class="thumb loading">&nbsp;</div>
							<div class="w-full loading">&nbsp;</div>
						</li>
					{/each}
				</ul>
			</section>
			<section
				class="card message {screen == 'mobile' && !contact ? 'hide' : ''}"
			>
				{#if contact}
					<section class="topbar">
						{#if screen == 'mobile'}
							<Button
								fab
								icon
								text
								size="small"
								on:click="{() => (contact = undefined)}"
							>
								<Icon path="{mdiChevronLeft}" />
							</Button>
						{/if}
						{#if contact.name}
							<img class="thumb" src="{contact.image}" alt="" />
						{:else}
							<Icon
								class="grey-text text-darken-3"
								path="{mdiAccountOutline}"
							/>
						{/if}
						<div>{contact.name}</div>
					</section>
					<Divider />
					<section bind:this="{content}" class="content">
						{#each contact.message as message}
							{#if message.sender.id == courier.chatNodeId}
								<section transition:scale class="item right primary-color">
									<div>{message.text}</div>
								</section>
							{:else}
								<section transition:scale class="item">
									<div>{message.text}</div>
								</section>
							{/if}
						{/each}
					</section>
					<Divider />
					<form
						autocomplete="off"
						on:submit|preventDefault="{send}"
						class="bottombar"
					>
						<TextField
							outlined
							dense
							placeholder="Ketik sesuatu..."
							bind:value="{messageText}"
						>
							<div slot="append">
								<Button
									fab
									icon
									text
									size="small"
									type="submit"
									disabled="{sendDisable}"
								>
									<Icon
										class="grey-text text-darken-3"
										path="{mdiSendOutline}"
									/>
								</Button>
							</div>
						</TextField>
					</form>
				{/if}
			</section>
		</main>
		<Snackbar bind:this="{snackbar}" />
	</MaterialAppMin>
</div>
