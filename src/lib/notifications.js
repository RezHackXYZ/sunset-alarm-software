import { supabase } from './supabase.client.js';

class NotificationService {
	constructor() {
		this.subscriptions = new Map();
		this.isSupported = typeof window !== 'undefined' && 'Notification' in window;
		this.pushSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
		this.serviceWorkerRegistration = null;
		this.pushSubscription = null;
	}

	async requestPermission() {
		if (!this.isSupported) {
			console.warn('Notifications not supported in this browser');
			return false;
		}

		if (Notification.permission === 'granted') {
			return true;
		}

		if (Notification.permission === 'denied') {
			console.warn('Notification permission denied');
			return false;
		}

		const permission = await Notification.requestPermission();
		return permission === 'granted';
	}

	async registerServiceWorker() {
		if (!this.pushSupported) {
			console.warn('Push notifications not supported in this browser');
			return false;
		}

		try {
			this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
			console.log('Service Worker registered successfully');
			return true;
		} catch (error) {
			console.error('Service Worker registration failed:', error);
			return false;
		}
	}

	async subscribeToPushNotifications() {
		if (!this.pushSupported || !this.serviceWorkerRegistration) {
			console.warn('Push notifications not available');
			return false;
		}

		try {
			let subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
			
			if (!subscription) {
				const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
				
				if (!vapidPublicKey || vapidPublicKey === 'YOUR_VAPID_PUBLIC_KEY') {
					console.error('VAPID public key not configured. Please set VITE_VAPID_PUBLIC_KEY in your environment variables.');
					return false;
				}

				subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
					userVisibleOnly: true,
					applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
				});
			}

			const response = await fetch('/api/push-subscription', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					subscription: subscription.toJSON(),
					userId: 'default'
				})
			});

			if (response.ok) {
				this.pushSubscription = subscription;
				console.log('Push subscription created successfully');
				return true;
			} else {
				console.error('Failed to store push subscription');
				return false;
			}
		} catch (error) {
			console.error('Error subscribing to push notifications:', error);
			return false;
		}
	}

	async unsubscribeFromPushNotifications() {
		if (!this.pushSubscription) {
			return false;
		}

		try {
			await this.pushSubscription.unsubscribe();
			
			await fetch('/api/push-subscription', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					endpoint: this.pushSubscription.endpoint
				})
			});

			this.pushSubscription = null;
			console.log('Push subscription removed successfully');
			return true;
		} catch (error) {
			console.error('Error unsubscribing from push notifications:', error);
			return false;
		}
	}

	async clearAndResubscribe() {
		if (!this.pushSupported || !this.serviceWorkerRegistration) {
			console.warn('Push notifications not available');
			return false;
		}

		try {
			// Clear existing subscription
			const existingSubscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
			if (existingSubscription) {
				await existingSubscription.unsubscribe();
				console.log('Cleared existing push subscription');
			}

			await fetch('/api/clear-subscriptions', {
				method: 'POST'
			});

			return await this.subscribeToPushNotifications();
		} catch (error) {
			console.error('Error clearing and resubscribing:', error);
			return false;
		}
	}

	urlBase64ToUint8Array(base64String) {
		if (!base64String || base64String === 'YOUR_VAPID_PUBLIC_KEY' || base64String.length < 10) {
			throw new Error('Invalid VAPID public key. Please configure VITE_VAPID_PUBLIC_KEY in your environment variables.');
		}

		try {
			const padding = '='.repeat((4 - base64String.length % 4) % 4);
			const base64 = (base64String + padding)
				.replace(/-/g, '+')
				.replace(/_/g, '/');

			const rawData = window.atob(base64);
			const outputArray = new Uint8Array(rawData.length);

			for (let i = 0; i < rawData.length; ++i) {
				outputArray[i] = rawData.charCodeAt(i);
			}
			return outputArray;
		} catch (error) {
			throw new Error(`Failed to convert VAPID public key: ${error.message}. Please ensure VITE_VAPID_PUBLIC_KEY is a valid base64 string.`);
		}
	}

	async subscribeToNotifications(table = 'Logs', event = 'INSERT') {
		if (!supabase) {
			console.warn('Supabase client not available');
			return null;
		}

		const channel = supabase
			.channel(`notifications-${table}-${event}`)
			.on(
				'postgres_changes',
				{ event, schema: 'public', table },
				(payload) => {
					this.handleNotification(payload);
				}
			)
			.subscribe();

		this.subscriptions.set(`${table}-${event}`, channel);
		return channel;
	}

	async subscribeToCustomChannel(channelName, event, callback) {
		if (!supabase) {
			console.warn('Supabase client not available');
			return null;
		}

		const channel = supabase
			.channel(channelName)
			.on('broadcast', { event }, (payload) => {
				callback(payload);
			})
			.subscribe();

		this.subscriptions.set(channelName, channel);
		return channel;
	}

	async subscribeToApiNotifications() {
		if (!supabase) {
			console.warn('Supabase client not available');
			return null;
		}

		const channel = supabase
			.channel('notifications')
			.on('broadcast', { event: 'notification' }, (payload) => {
				this.handleApiNotification(payload.payload);
			})
			.subscribe();

		this.subscriptions.set('api-notifications', channel);
		return channel;
	}

	handleNotification(payload) {
		if (!this.isSupported || Notification.permission !== 'granted') {
			return;
		}

		// Create notification based on payload
		const notification = new Notification('Sunset Alarm', {
			body: this.formatNotificationBody(payload),
			icon: '/favicon.png', // You can add a custom icon
			tag: 'sunset-alarm', // Prevents duplicate notifications
			requireInteraction: true // Keeps notification until user interacts
		});

		// Handle notification click
		notification.onclick = () => {
			window.focus();
			notification.close();
		};
	}

	handleApiNotification(payload) {
		if (!this.isSupported || Notification.permission !== 'granted') {
			return;
		}

		const { title, body, type } = payload;
		
		const notification = new Notification(title || 'Sunset Alarm', {
			body: body || 'New notification',
			icon: '/favicon.png',
			tag: `api-notification-${type}-${Date.now()}`, // Unique tag for API notifications
			requireInteraction: true
		});

		notification.onclick = () => {
			window.focus();
			notification.close();
		};
	}

	formatNotificationBody(payload) {
		const { new: newRecord, old: oldRecord, eventType } = payload;
		
		switch (eventType) {
			case 'INSERT':
				if (newRecord.EventType === 'testOnOrOff') {
					return newRecord.ChangeTo === 'true' 
						? 'Alarm has been enabled!' 
						: 'Alarm has been disabled!';
				}
				if (newRecord.EventType === 'notification') {
					try {
						const notificationData = JSON.parse(newRecord.ChangeTo);
						return notificationData.body || 'New notification';
					} catch (e) {
						return 'New notification';
					}
				}
				return 'New event occurred';
			case 'UPDATE':
				return 'Event updated';
			case 'DELETE':
				return 'Event deleted';
			default:
				return 'New notification';
		}
	}

	async sendCustomNotification(title, body, options = {}) {
		if (!this.isSupported || Notification.permission !== 'granted') {
			return;
		}

		const notification = new Notification(title, {
			body,
			icon: '/favicon.png',
			...options
		});

		notification.onclick = () => {
			window.focus();
			notification.close();
		};

		return notification;
	}

	async sendPushNotification(title, body, type = 'custom') {
		try {
			const response = await fetch('/api/send-push', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					title,
					body,
					type
				})
			});
			
			const result = await response.json();
			console.log('Push notification result:', result);
			return result;
		} catch (error) {
			console.error('Failed to send push notification:', error);
			return { error: error.message };
		}
	}

	unsubscribe(channelKey) {
		const channel = this.subscriptions.get(channelKey);
		if (channel && supabase) {
			supabase.removeChannel(channel);
			this.subscriptions.delete(channelKey);
		}
	}

	unsubscribeAll() {
		if (!supabase) return;
		
		this.subscriptions.forEach((channel, key) => {
			supabase.removeChannel(channel);
		});
		this.subscriptions.clear();
	}

	async initialize() {
		const results = {
			notifications: false,
			pushNotifications: false,
			serviceWorker: false
		};

		results.notifications = await this.requestPermission();

		if (this.pushSupported) {
			results.serviceWorker = await this.registerServiceWorker();
			if (results.serviceWorker && results.notifications) {
				results.pushNotifications = await this.subscribeToPushNotifications();
			}
		}

		console.log('Notification service initialization results:', results);
		return results;
	}
}

// Only create the service instance in the browser
let notificationService = null;
if (typeof window !== 'undefined') {
	notificationService = new NotificationService();
}

export { notificationService }; 