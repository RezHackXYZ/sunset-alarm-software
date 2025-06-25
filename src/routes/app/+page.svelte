<script>
	import { createClient } from "@supabase/supabase-js";
	import { PUBLIC_SUPABASE_URL } from "$env/static/public";
	import { onMount } from "svelte";

	let supabase;
	let enabled = false;

	onMount(() => {
		if ((localStorage.getItem("SERVICE_ROLE_KEY") || null) == null) {
			window.location.replace("login");
		}

		supabase = createClient(PUBLIC_SUPABASE_URL, localStorage.getItem("SERVICE_ROLE_KEY"));

		const channel = supabase
			.channel("custom-insert-channel")
			.on(
				"postgres_changes",
				{ event: "INSERT", schema: "public", table: "AlarmStatus" },
				(payload) => {
					enabled = payload.new.Value;
				},
			)
			.subscribe();
	});
</script>

{#if !enabled}
	<button
		class="btn green"
		on:click={async () => {
			const { data, error } = await supabase
				.from("AlarmStatus")
				.insert([{ Value: true }])
				.select();
		}}
	>
		enable
	</button>
{:else}
	<button
		class="btn red"
		on:click={async () => {
			const { data, error } = await supabase
				.from("AlarmStatus")
				.insert([{ Value: false }])
				.select();
		}}
	>
		disable
	</button>
{/if}
