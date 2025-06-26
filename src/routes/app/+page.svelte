<script>
	import { onMount } from "svelte";

	let enabled = false;

	onMount(() => {
		if ((localStorage.getItem("password") || null) == null) {
			window.location.replace("login");
		}

		const eventSource = new EventSource("/api/stream");

		eventSource.onmessage = (e) => {
			const data = JSON.parse(e.data);
			enabled = data.new.ChangeTo == "true";
		};
	});
</script>

{#if !enabled}
	<button
		class="btn green"
		on:click={async () => {
			fetch("/api/enable");
		}}
	>
		enable
	</button>
{:else}
	<button
		class="btn red"
		on:click={async () => {
			fetch("/api/disable");
		}}
	>
		disable
	</button>
{/if}
