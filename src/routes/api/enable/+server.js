import { supabase } from "$lib/supabase.server.js";

export async function GET() {
	const { data, error } = await supabase
		.from("Logs")
		.insert([{ EventType: "testOnOrOff", ChangeTo: "true" }])
		.select();

	if (error) {
		return new Response(JSON.stringify({ error: error.message }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}

	return new Response(JSON.stringify({ success: true, data }), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});
}
