<script context="module" lang="ts">
	import { slide } from 'svelte/transition';

	import { Button, Icon, Footer } from 'svelte-materialify/src';
	import {
		mdiFacebook,
		mdiInstagram,
		mdiEmailOutline,
		mdiMapMarkerOutline,
		mdiClockOutline,
	} from '@mdi/js';
</script>

<script lang="ts">
	export let desktop = false;
	export let navigation: {
		name: string;
		desc: string;
		icon: string;
		link: string;
		action?: (event: Event) => void;
	}[] = [];
	export let link = '';
</script>

<style lang="scss">
	@import '../../components/common';
	@import '../../components/elevation';
	@import '../../components/skeleton';
	.loading {
		@include loading-sekeleton;
		min-height: 28px;
	}
	.nav {
		@include elevation;
		position: sticky;
		bottom: 0;
		padding: 4px;
		display: flex;
		align-items: center;
		background-color: white;
	}
	.link {
		display: grid;
		place-items: center;
		width: 50%;
		ul {
			padding: 0;
			display: flex;
			justify-content: space-evenly;
			width: stretch;
		}
		li {
			list-style: none;
			padding: 2px;
		}
		a {
			display: grid;
			justify-items: center;
			row-gap: 2px;
			border-radius: 6px;
			text-transform: capitalize;
			text-decoration: none;
			font-size: 11px;
		}
	}
	.btn {
		display: grid;
		place-items: center;
		width: 50%;
		a {
			display: grid;
			padding: 0 16px;
			width: stretch;
			text-decoration: none;
		}
	}
	:global {
		.nav {
			.s-btn.icon,
			.s-btn.s-btn--fab {
				border-radius: 6px;
			}
		}
	}
</style>

{#if !desktop}
	<nav transition:slide class="nav">
		<div class="link">
			<ul>
				{#each navigation as item}
					<li>
						<Button text fab size="small">
							<a
								class="grey-text text-darken-3"
								href="{item.link}"
								on:click="{item.action}"
								><Icon path="{item.icon}" />
								<div>{item.name}</div>
							</a>
						</Button>
					</li>
				{/each}
			</ul>
		</div>
		<section class="btn">
			<a href="{link}">
				<Button outlined>Beli</Button>
			</a>
		</section>
	</nav>
{/if}
