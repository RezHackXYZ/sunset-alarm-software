<script>
	function enable() {
		fetch("api/enable")
			.then((response) => {
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				return response.json();
			})
			.catch((error) => {
				console.error("There was a problem with the fetch operation:", error);
			});
	}

	function disable() {
		fetch("api/disable")
			.then((response) => {
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				return response.json();
			})
			.catch((error) => {
				console.error("There was a problem with the fetch operation:", error);
			});
	}

	let haveSecretKey = false;

	//getSecretKeyInExchangeToPassword
</script>

<div class="flex h-full items-center justify-center">
	<div class="flex flex-col gap-4">
			<button class="btn green" on:click={() => enable()}> enable </button>
			<button class="btn red" on:click={() => disable()}> disable </button>
	</div>
</div>
