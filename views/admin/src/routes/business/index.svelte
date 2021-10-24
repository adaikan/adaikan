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

	import { Diff, genRandomNumber } from '$lib/helper';

	import type { ClientApi, User } from '../__layout.svelte';

	const title = 'Business';
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
	let disable = true;
	let copy: any;
	let slides: ClientApi.Admin.Slide[] = [];
	let slides_image: FormData;
	let errorText = '';

	$: {
		if (copy) {
			const changed = Diff.object(copy, { config, slides });
			if (changed) {
				disable = false;
			} else {
				disable = true;
			}
		}
	}

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
			slides = await client.admin.getSlide();

			slides_image = new FormData();

			copy = Diff.objectCopy({ config, slides });
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
			const changed = Diff.object(copy, { config, slides });
			if (changed) {
				if (changed.config) {
					await client.admin.setBusiness(config);
				}
				if (changed.slides) {
					await client.admin.setSlide(slides, slides_image);
				}
				Diff.objectAssign(copy, { config, slides });
			}
		} catch (error: any) {
			errorText = error.message;
			disable = false;
		} finally {
			progress.hiding();
		}
	}
	function inputFile(this: HTMLInputElement) {
		if (this.files) {
			for (let index = 0; index < this.files.length; index++) {
				const file = this.files[index];
				const id = genRandomNumber();
				slides_image.append(id + '', file);
				slides.push({ src: URL.createObjectURL(file), href: '', id });
			}
			slides = slides;
			console.log(slides);
		}
	}
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={desc} />
</svelte:head>

<Page {mode} class="text-gray-900 bg-gray-50 dark:text-gray-50 dark:bg-gray-900">
	<section transition:fade class="flex">
		<Drawer min_width={false} show={drawerOpened} class="bg-base-100 w-[300px]">
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
														slides_image.delete(index + '');
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
													bind:value={slide.href}
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
												accept="image/*"
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
			<div class="flex-grow" />
			<Footer class="bg-base-100 justify-center">
				<FooterContent />
			</Footer>
		</Content>
	</section>
</Page>

<style lang="scss">
</style>
