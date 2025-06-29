import { supabase } from "$lib/supabase.server.js";
import { json } from '@sveltejs/kit';

export async function POST() {
	try {
		const { error } = await supabase
			.from("PushSubscriptions")
			.delete()
			.neq('id', 0);

		if (error) {
			console.error('Error clearing push subscriptions:', error);
			return json({ error: error.message }, { status: 500 });
		}

		return json({ 
			success: true, 
			message: 'All push subscriptions cleared successfully'
		});

	} catch (error) {
		console.error('Error in clear-subscriptions endpoint:', error);
		return json({ 
			error: 'Server error while clearing subscriptions',
			details: error.message 
		}, { status: 500 });
	}
}

export async function GET() {
	return json({ 
		message: 'Clear subscriptions endpoint',
		usage: 'Send POST request to clear all push subscriptions'
	});
} 