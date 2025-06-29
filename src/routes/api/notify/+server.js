import { supabase } from "$lib/supabase.server.js";
import { json } from '@sveltejs/kit';
import webpush from 'web-push';

function getVapidConfig() {
	const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
	const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
	const VAPID_EMAIL = process.env.VAPID_EMAIL || 'your-email@example.com';

	if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
		throw new Error('VAPID keys not configured. Please set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in your environment variables.');
	}

	return { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL };
}

function initializeVapid() {
	try {
		const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL } = getVapidConfig();
		webpush.setVapidDetails(
			`mailto:${VAPID_EMAIL}`,
			VAPID_PUBLIC_KEY,
			VAPID_PRIVATE_KEY
		);
		return true;
	} catch (error) {
		console.error('Failed to initialize VAPID:', error.message);
		return false;
	}
}

export async function POST({ request }) {
	try {
		// Get the request body as text first, then parse as JSON
		const bodyText = await request.text();
		const requestBody = JSON.parse(bodyText);
		const { title = 'Sunset Alarm', body, type = 'custom' } = requestBody;

		// Insert a notification record into the Logs table
		const { data, error } = await supabase
			.from("Logs")
			.insert([{ 
				EventType: "notification", 
				ChangeTo: JSON.stringify({ title, body, type })
			}])
			.select();

		if (error) {
			return json({ error: error.message }, { status: 500 });
		}

		// Broadcast the notification to connected clients
		await supabase
			.channel('notifications')
			.send({
				type: 'broadcast',
				event: 'notification',
				payload: { title, body, type, timestamp: new Date().toISOString() }
			});

		try {
			if (initializeVapid()) {
				const { data: subscriptions, error: pushError } = await supabase
					.from("PushSubscriptions")
					.select('*');

				if (!pushError && subscriptions && subscriptions.length > 0) {
					const payload = JSON.stringify({
						title,
						body,
						type,
						timestamp: new Date().toISOString(),
						icon: '/favicon.png',
						badge: '/favicon.png',
						tag: `push-${type}-${Date.now()}`,
						requireInteraction: true,
						actions: [
							{
								action: 'open',
								title: 'Open App',
								icon: '/favicon.png'
							},
							{
								action: 'close',
								title: 'Close',
								icon: '/favicon.png'
							}
						]
					});

					const pushPromises = subscriptions.map(async (subscription) => {
						try {
							const pushSubscription = {
								endpoint: subscription.endpoint,
								keys: {
									p256dh: subscription.p256dh,
									auth: subscription.auth
								}
							};

							await webpush.sendNotification(pushSubscription, payload);
							return { success: true, endpoint: subscription.endpoint };
						} catch (error) {
							console.error('Error sending push notification:', error);
							
							if (error.statusCode === 410 || error.statusCode === 404) {
								await supabase
									.from("PushSubscriptions")
									.delete()
									.eq('endpoint', subscription.endpoint);
							}
							
							return { success: false, endpoint: subscription.endpoint, error: error.message };
						}
					});

					const results = await Promise.allSettled(pushPromises);
					const successful = results.filter(result => 
						result.status === 'fulfilled' && result.value.success
					).length;
					const failed = results.length - successful;

					console.log(`Push notifications sent: ${successful} successful, ${failed} failed`);
				}
			} else {
				console.warn('Push notifications not available - VAPID not configured');
			}
		} catch (pushError) {
			console.error('Error sending push notifications:', pushError);
		}

		return json({ 
			success: true, 
			data,
			message: 'Notification triggered successfully'
		});

	} catch (error) {
		return json({ 
			error: 'Invalid request body or server error',
			details: error.message 
		}, { status: 400 });
	}
}

// Also support GET requests for testing
export async function GET() {
	return json({ 
		message: 'Notification API endpoint',
		usage: 'Send POST request with { title, body, type } to trigger a notification'
	});
} 