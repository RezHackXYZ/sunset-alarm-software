<script>
	import { onMount } from "svelte";
	import { notificationService } from "$lib/notifications.js";

	let enabled = false;
	let notificationsEnabled = false;
	let pushNotificationsEnabled = false;
	let serviceWorkerEnabled = false;
	let initializationResults = null;

	onMount(async () => {
		if ((localStorage.getItem("password") || null) == null) {
			window.location.replace("login");
		}

		if (notificationService) {
			initializationResults = await notificationService.initialize();
			notificationsEnabled = initializationResults.notifications;
			pushNotificationsEnabled = initializationResults.pushNotifications;
			serviceWorkerEnabled = initializationResults.serviceWorker;

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

	async function testPushNotification() {
		if (notificationService) {
			const result = await notificationService.sendPushNotification(
				'Push Test Notification',
				'This is a push notification test - should work even when browser is closed!',
				'test'
			);
			console.log('Push notification test result:', result);
		}
	}

	async function enablePushNotifications() {
		if (notificationService) {
			pushNotificationsEnabled = await notificationService.subscribeToPushNotifications();
		}
	}

	async function disablePushNotifications() {
		if (notificationService) {
			await notificationService.unsubscribeFromPushNotifications();
			pushNotificationsEnabled = false;
		}
	}

	async function clearAndResubscribe() {
		if (notificationService) {
			pushNotificationsEnabled = await notificationService.clearAndResubscribe();
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

		<button 
			class="btn blue ml-2" 
			on:click={testPushNotification}
		>
			Test Push Notification
		</button>
	</div>
{/if}

<!-- Notification status and controls -->
{#if notificationService}
	<div class="mt-4 p-4 border rounded">
		<h3 class="text-lg font-semibold mb-2">Notification Status</h3>
		
		<div class="space-y-2">
			<div class="flex items-center">
				<span class="w-4 h-4 rounded-full mr-2 {notificationsEnabled ? 'bg-green-500' : 'bg-red-500'}"></span>
				<span>Browser Notifications: {notificationsEnabled ? 'Enabled' : 'Disabled'}</span>
			</div>
			
			<div class="flex items-center">
				<span class="w-4 h-4 rounded-full mr-2 {serviceWorkerEnabled ? 'bg-green-500' : 'bg-red-500'}"></span>
				<span>Service Worker: {serviceWorkerEnabled ? 'Registered' : 'Not Available'}</span>
			</div>
			
			<div class="flex items-center">
				<span class="w-4 h-4 rounded-full mr-2 {pushNotificationsEnabled ? 'bg-green-500' : 'bg-red-500'}"></span>
				<span>Push Notifications: {pushNotificationsEnabled ? 'Enabled' : 'Disabled'}</span>
			</div>
		</div>

		<!-- Push notification controls -->
		{#if serviceWorkerEnabled && notificationsEnabled}
			<div class="mt-3">
				{#if pushNotificationsEnabled}
					<button 
						class="btn red" 
						on:click={disablePushNotifications}
					>
						Disable Push Notifications
					</button>
					
					<button 
						class="btn blue ml-2" 
						on:click={clearAndResubscribe}
					>
						Reset Push Subscription
					</button>
				{:else}
					<button 
						class="btn green" 
						on:click={enablePushNotifications}
					>
						Enable Push Notifications
					</button>
				{/if}
			</div>
		{/if}

		<!-- Help text -->
		{#if !notificationsEnabled}
			<div class="mt-2 text-sm text-gray-600 dark:text-gray-400">
				Browser notifications are disabled. Click to enable:
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

		{#if !serviceWorkerEnabled}
			<div class="mt-2 text-sm text-gray-600 dark:text-gray-400">
				Service Worker not available. Push notifications require HTTPS and a modern browser.
			</div>
		{/if}

		{#if notificationsEnabled && serviceWorkerEnabled && !pushNotificationsEnabled}
			<div class="mt-2 text-sm text-gray-600 dark:text-gray-400">
				Push notifications are disabled. Enable them to receive notifications when the browser is closed.
			</div>
		{/if}
	</div>
{/if}
