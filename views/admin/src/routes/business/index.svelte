<script context="module" lang="ts">
	import { onMount, onDestroy, getContext } from 'svelte';
	import { fade, scale } from 'svelte/transition';

	import Page from '$components/page.svelte';
	import Appbar from '$components/appbar.svelte';
	import Drawer, { slide } from '$components/drawer.svelte';
	import Content from '$components/content.svelte';
	import Main from '$components/main.svelte';
	import Footer from '$components/footer.svelte';
	import Progress from '$components/progress.svelte';
	import AppbarContent from '../dashboard/_appbar.svelte';
	import DrawerContent from '../dashboard/_drawer.svelte';
	import FooterContent from '../dashboard/_footer.svelte';

	import { base } from '$app/paths';
	import { goto } from '$app/navigation';

	import { Diff } from '$lib/helper';

	import type { ClientApi, User } from '../__layout.svelte';

	const title = 'Server';
	const desc = '';
</script>

<script lang="ts">
	const client = getContext<ClientApi>('clientApi');
	const user = getContext<User>('user');

	let mode = 'dark';
	let drawerOpened = true;
	let account = { image: '', name: '', role: '' };
	let user_login = $user;
	let progress: Progress;

	let config: ClientApi.Admin.Data['business'];
	let disable = false;
	let copy: any;
	let slides: ClientApi.Admin.Slide[] = [];
	let form_slide: FormData;
	let errorText = '';

	onMount(init);
	onDestroy(release);

	async function init() {
		try {
			await client.ready;

			if (!user_login) {
				return goto(base + '/');
			}
			account = {
				image: user_login.image ?? '',
				name: user_login.username,
				role: user_login.role
			};
			config = await client.admin.getBusiness();
			copy = Diff.objectCopy(config);

			slides = await client.admin.getSlide();
			form_slide = new FormData();
			for (const slide of slides) {
				const response = await fetch(slide.src);
				const image = await response.blob();
				form_slide.append(slide.id + '', image);
				slide.src = URL.createObjectURL(image);
			}
		} catch (error: any) {
			console.error(error);
		} finally {
			progress.hiding();
		}
	}
	async function release() {
		try {
		} catch (error: any) {
			console.error(error);
		} finally {
		}
	}
	async function save() {
		try {
			progress.showing();
			disable = true;
			const changed = Diff.object(copy, config);
			if (changed) {
				const decision = Diff.objectCopy(config);
				const result = await client.admin.setBusiness(decision);
				config = result;
				Diff.objectAssign(copy, config);
			}
			if (form_slide) {
				for (const slide of slides) {
					form_slide.append('link', slide.link);
				}
				const result = await client.admin.setSlide(form_slide);
			}
		} catch (error: any) {
			errorText = error.message;
		} finally {
			disable = false;
			progress.hiding();
		}
	}
	function inputFile(this: HTMLInputElement) {
		if (this.files) {
			for (let index = slides.length; index < this.files.length; index++) {
				const file = this.files[index];
				form_slide.append(index + '', file);
				slides.push({ src: URL.createObjectURL(file), link: '', id: index });
			}
			slides = slides;
		}
	}
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={desc} />
</svelte:head>

<Page {mode} class="text-gray-900 bg-gray-50 dark:text-gray-50 dark:bg-gray-900">
	<section transition:fade class="flex w-screen h-screen overflow-auto">
		<Drawer min_width={false} show={drawerOpened} class="bg-base-100 w-[300px]">
			<DrawerContent />
		</Drawer>
		<Content class="flex-grow w-full h-screen overflow-auto">
			<Appbar class="bg-base-100">
				<AppbarContent bind:account bind:mode bind:drawerOpened />
			</Appbar>
			<Progress bind:this={progress} />
			<Main class="flex-grow w-full">
				<section>
					<div class="text-2xl font-bold">{title}</div>
				</section>
				<form on:submit|preventDefault={save} class="grid bg-base-100 p-6 rounded-lg">
					<div class="grid gap-12 w-[320px] justify-self-center">
						<div class="grid gap-4">
							{#if config}
								<div class="form-control">
									<label for="delivery-cost-distance" class="label">
										<span class="label-text">Delivery Cost Per Distance (kg)</span>
										<input
											type="checkbox"
											bind:checked={config.deliveryCostCalculatePerDistanceActive}
											class="toggle toggle-primary"
										/>
									</label>
									<input
										bind:value={config.deliveryCostCalculatePerDistance}
										type="number"
										id="delivery-cost-distance"
										class="input input-ghost input-primary bg-base-200"
									/>
								</div>
								<div class="form-control">
									<label for="product-price" class="label">
										<span class="label-text">Product Price Increase</span>
										<input
											type="checkbox"
											bind:checked={config.productPriceIncreaseActive}
											class="toggle toggle-primary"
										/>
									</label>
									<input
										bind:value={config.productPriceIncrease}
										type="number"
										id="product-price"
										class="input input-ghost input-primary bg-base-200"
									/>
								</div>
								<div class="form-control">
									<label for="image" class="label">
										<span class="label-text">Slides</span>
									</label>
									<div
										class="px-3 py-2 border border-primary bg-base-200 rounded-md flex flex-wrap gap-4"
									>
										{#each slides as slide, index}
											<div
												class="form-control p-4 flex flex-col flex-grow gap-2 rounded-md bg-base-100 relative"
											>
												<button
													type="button"
													on:click={() => {
														form_slide.delete(index + '');
														slides.splice(index, 1);
														slides = slides;
													}}
													class="btn btn-xs btn-square btn-error grid place-content-center absolute top-2 left-2"
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
															d="M6 18L18 6M6 6l12 12"
														/></svg
													>
												</button>
												<label for="image-{index}" class="label justify-center ">
													<img src={slide.src} alt="" class="h-full" />
												</label>
												<input
													bind:value={slide.link}
													id="image-{index}"
													type="url"
													required
													class="input input-sm bg-base-200"
												/>
											</div>
										{/each}
										<div
											class="w-full flex-grow relative {slides.length
												? ' p-4 flex flex-col flex-grow gap-2 rounded-md bg-base-100'
												: ''}"
										>
											<input
												on:input={inputFile}
												id="image"
												type="file"
												accept="image"
												multiple
												class="w-full h-full absolute opacity-0 z-10 cursor-pointer"
											/>
											<svg
												class="w-8 h-8  z-0"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
												xmlns="http://www.w3.org/2000/svg"
												><path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
												/></svg
											>
										</div>
									</div>
								</div>
							{:else}
								<div class="px-1 py2 bg-base-200 rounded min-h-12 animate-pulse">&nbsp;</div>
								<div class="px-1 py2 bg-base-200 rounded min-h-12 animate-pulse">&nbsp;</div>
								<div class="px-1 py2 bg-base-200 rounded min-h-12 animate-pulse">&nbsp;</div>
							{/if}
						</div>
						<button
							type="submit"
							disabled={disable}
							class="btn btn-primary {disable ? 'btn-disabled' : ''}">Save</button
						>
					</div>
				</form>
			</Main>
			<Footer class="bg-base-100 justify-center">
				<FooterContent />
			</Footer>
		</Content>
	</section>
</Page>

<style lang="scss">
</style>
