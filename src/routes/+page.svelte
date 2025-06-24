<script>
	function enable() {
		fetch("/api/enable")
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
		fetch("./api/disable")
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
</script>

<button class="btn green" on:click={() => enable()}> enable </button>
<button class="btn red" on:click={() => disable()}> disable </button>
