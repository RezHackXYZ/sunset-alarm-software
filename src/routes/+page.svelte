<script>
	import { onMount } from "svelte";

	onMount(() => {
		if ((localStorage.getItem("password") || null) == null) {
			window.location.replace("./login");
		} else {
			window.location.replace("./app");
		}
	});
</script>
