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
		if (!initializeVapid()) {
			return json({ 
				error: 'Push notifications not configured properly',
				details: 'VAPID keys are missing or invalid'
			}, { status: 500 });
		}

		const { title = 'Sunset Alarm', body, type = 'custom', userId } = await request.json();

		let query = supabase.from("PushSubscriptions").select('*');
		if (userId) {
			query = query.eq('user_id', userId);
		}

		const { data: subscriptions, error } = await query;

		if (error) {
			console.error('Error fetching push subscriptions:', error);
			return json({ error: error.message }, { status: 500 });
		}

		if (!subscriptions || subscriptions.length === 0) {
			return json({ 
				message: 'No push subscriptions found',
				sent: 0 
			});
		}

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

		await supabase
			.from("Logs")
			.insert([{ 
				EventType: "push_notification", 
				ChangeTo: JSON.stringify({ title, body, type, sent: successful, failed })
			}]);

		return json({ 
			success: true,
			message: `Push notifications sent: ${successful} successful, ${failed} failed`,
			sent: successful,
			failed,
			total: results.length
		});

	} catch (error) {
		console.error('Error in send-push endpoint:', error);
		return json({ 
			error: 'Server error while sending push notifications',
			details: error.message 
		}, { status: 500 });
	}
}

export async function GET() {
	try {
		const { VAPID_PUBLIC_KEY } = getVapidConfig();
		return json({ 
			message: 'Push notification API endpoint',
			usage: 'Send POST request with { title, body, type, userId? } to send push notifications',
			vapid_public_key: VAPID_PUBLIC_KEY,
			configured: true
		});
	} catch (error) {
		return json({ 
			message: 'Push notification API endpoint',
			usage: 'Send POST request with { title, body, type, userId? } to send push notifications',
			configured: false,
			error: error.message
		});
	}
} 