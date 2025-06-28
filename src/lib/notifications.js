import { supabase } from './supabase.client.js';

class NotificationService {
	constructor() {
		this.subscriptions = new Map();
		this.isSupported = typeof window !== 'undefined' && 'Notification' in window;
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
}

// Only create the service instance in the browser
let notificationService = null;
if (typeof window !== 'undefined') {
	notificationService = new NotificationService();
}

export { notificationService }; 