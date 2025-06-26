import { supabase } from "$lib/supabase.server.js";

export async function GET({ url }) {
	const password = url.searchParams.get("password");
	const type = url.searchParams.get("type");

	let { data, error } = await supabase
		.from("Auth")
		.select("*")
		.eq("Type", type)
		.eq("Key", password);

	if (error) {
		return new Response(JSON.stringify({ error: error.message }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}

	return new Response(JSON.stringify({ isPasswordRight: data.length > 0 }), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});
}
