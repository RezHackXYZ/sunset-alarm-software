import { supabase } from "$lib/supabase.server.js";
import { json } from '@sveltejs/kit';

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