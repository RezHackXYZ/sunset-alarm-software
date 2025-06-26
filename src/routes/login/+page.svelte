<script>
	import { onMount } from "svelte";
	import { toast } from "svelte-5-french-toast";

	let password = "";

	function login() {
		if (password.trim() === "") {
			toast.error("Please enter a password");
		} else {
			toast.promise(
				fetch(
					"/api/checkPassword?type=LoginPassword&password=" + encodeURIComponent(password),
				).then(async (response) => {
					if (!response.ok) {
						throw new Error(`HTTP error! status: ${response.status}`);
					}
					const data = await response.json();
					if (data.isPasswordRight) {
						localStorage.setItem("password", password);
						setTimeout(() => {
							window.location.replace("app");
						}, 500);
						return null;
					} else {
						throw new Error("Wrong Password!");
					}
				}),
				{
					loading: "Logging in...",
					success: "Login successful!",
					error: (err) => `Login failed: ${err.message}`,
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
