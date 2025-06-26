<script>
	import { onMount } from "svelte";

	onMount(() => {
		//if ((localStorage.getItem("SERVICE_ROLE_KEY") || null) == null) {
		if (false) {
			window.location.replace("./login");
		} else {
			window.location.replace("./app");
		}
	});
</script>
