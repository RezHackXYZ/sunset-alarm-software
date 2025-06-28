<script>
	import { onMount } from "svelte";
	import { notificationService } from "$lib/notifications.js";

	let enabled = false;
	let notificationsEnabled = false;

	onMount(async () => {
		if ((localStorage.getItem("password") || null) == null) {
			window.location.replace("login");
		}

		// Request notification permission if service is available
		if (notificationService) {
			notificationsEnabled = await notificationService.requestPermission();

			// Subscribe to real-time notifications
			await notificationService.subscribeToNotifications('Logs', 'INSERT');
			
			// Subscribe to API-triggered notifications
			await notificationService.subscribeToApiNotifications();
		}

		// Keep existing EventSource for backward compatibility
		const eventSource = new EventSource("/api/stream");

		eventSource.onmessage = (e) => {
			const data = JSON.parse(e.data);
			enabled = data.new.ChangeTo == "true";
		};
	});

	async function testNotification() {
		if (notificationService) {
			await notificationService.sendCustomNotification(
				'Test Notification', 
				'This is a test notification to verify everything is working!'
			);
		}
	}

	async function testApiNotification() {
		try {
			const response = await fetch('/api/notify', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					title: 'API Test Notification',
					body: 'This notification was triggered via the API endpoint!',
					type: 'test'
				})
			});
			
			const result = await response.json();
			console.log('API notification result:', result);
		} catch (error) {
			console.error('Failed to trigger API notification:', error);
		}
	}
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

<!-- Test notification button -->
{#if notificationService}
	<div class="mt-4">
		<button 
			class="btn blue" 
			on:click={testNotification}
		>
			Test Notification
		</button>
		
		<button 
			class="btn blue ml-2" 
			on:click={testApiNotification}
		>
			Test API Notification
		</button>
	</div>
{/if}

{#if notificationService && !notificationsEnabled}
	<div class="mt-4 text-sm text-gray-600 dark:text-gray-400">
		Notifications are disabled. Click to enable:
		<button 
			class="btn blue ml-2" 
			on:click={async () => {
				notificationsEnabled = await notificationService.requestPermission();
			}}
		>
			Enable Notifications
		</button>
	</div>
{/if}
