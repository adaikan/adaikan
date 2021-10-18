<script context="module" lang="ts">
</script>

<script lang="ts">
	let classname = '';
	export { classname as class };
	export let mode = 'dark';
	$: update(classname, mode);
	let body: HTMLBodyElement | null;
	let html: HTMLHtmlElement | null;
	function manage(node: HTMLBodyElement) {
		html = document.querySelector('html');
		body = node;
		update();
	}
	function update(...tag: any[]) {
		if (html) {
			html.className = mode;
			html.setAttribute('data-theme', mode);
		}
		if (body) {
			body.className = classname;
		}
	}
</script>

<svelte:body use:manage />

<slot />

<style lang="scss">
</style>
