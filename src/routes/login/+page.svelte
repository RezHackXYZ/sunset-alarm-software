<script>
	import { error } from "@sveltejs/kit";
	import { onMount } from "svelte";
	import { toast } from "svelte-5-french-toast";

	let password = "";

	function login() {
		if (password.trim() === "") {
			toast.error("Please enter a password");
		} else {
			toast.promise(
				fetch(
					"/api/getSecretKeyInExchangeToPassword?password=" + encodeURIComponent(password),
				).then(async (response) => {
					if (!response.ok) {
						if (response.status == 401) {
							throw new Error("Wrong Password.");
						}
						throw new Error(`HTTP error! status: ${response.status}`);
					}
					const data = await response.text();
					localStorage.setItem("SERVICE_ROLE_KEY", data);
					setTimeout(() => {
						window.location.replace("app");
					}, 1000);
					return data;
				}),
				{
					loading: "Logging in...",
					success: "Login successful!",
					error: (err) => `Login failed. ${err.message}`,
				},
			);
		}
	}

	onMount(() => {
		if ((localStorage.getItem("SERVICE_ROLE_KEY") || null) != null) {
			window.location.replace("app");
		}
	});
</script>

<input class="inp" bind:value={password} type="text" placeholder="password" />
<button class="btn green w-fit" on:click={login}>login</button>
