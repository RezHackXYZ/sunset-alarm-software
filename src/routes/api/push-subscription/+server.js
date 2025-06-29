import { supabase } from "$lib/supabase.server.js";
import { json } from '@sveltejs/kit';

export async function POST({ request }) {
	try {
		const { subscription, userId } = await request.json();

		if (!subscription) {
			return json({ error: 'Subscription data is required' }, { status: 400 });
		}

		const { data, error } = await supabase
			.from("PushSubscriptions")
			.upsert([{
				user_id: userId || 'default',
				endpoint: subscription.endpoint,
				p256dh: subscription.keys.p256dh,
				auth: subscription.keys.auth,
				created_at: new Date().toISOString()
			}], {
				onConflict: 'endpoint'
			})
			.select();

		if (error) {
			console.error('Error storing push subscription:', error);
			return json({ error: error.message }, { status: 500 });
		}

		return json({ 
			success: true, 
			message: 'Push subscription stored successfully',
			data 
		});

	} catch (error) {
		console.error('Error in push subscription endpoint:', error);
		return json({ 
			error: 'Invalid request body or server error',
			details: error.message 
		}, { status: 400 });
	}
}

export async function DELETE({ request }) {
	try {
		const { endpoint } = await request.json();

		if (!endpoint) {
			return json({ error: 'Endpoint is required' }, { status: 400 });
		}

		const { error } = await supabase
			.from("PushSubscriptions")
			.delete()
			.eq('endpoint', endpoint);

		if (error) {
			console.error('Error removing push subscription:', error);
			return json({ error: error.message }, { status: 500 });
		}

		return json({ 
			success: true, 
			message: 'Push subscription removed successfully'
		});

	} catch (error) {
		console.error('Error in push subscription delete endpoint:', error);
		return json({ 
			error: 'Invalid request body or server error',
			details: error.message 
		}, { status: 400 });
	}
} 