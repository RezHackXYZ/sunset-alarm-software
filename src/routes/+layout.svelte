<script>
	import { Toaster } from "svelte-5-french-toast";

	import "./app.css";

	let { children } = $props();
</script>

<Toaster />

<div class="flex h-full items-center justify-center bg-white dark:bg-black dark:text-white font-[Space_Grotesk]">
	<div class="flex flex-col gap-4">{@render children()}</div>
</div>

<style>
	@import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300&display=swap");
</style>
