<script>
	import { onMount } from "svelte";

	let enabled = false;

	onMount(() => {
		//if ((localStorage.getItem("SERVICE_ROLE_KEY") || null) == null) {
		if (false) {
			window.location.replace("login");
		}

		new EventSource("/api/stream").onmessage = (e) => {
			enabled = JSON.parse(e.data).new.ChangeTo;
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
