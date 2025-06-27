import { supabase } from "$lib/supabase.server.js";

const rateLimitMap = new Map();
const WINDOW_SIZE = 60 * 1000; 
const MAX_REQUESTS = 10; 

export async function GET({ url, request }) {
	const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
	const now = Date.now();
	let entry = rateLimitMap.get(ip);
	if (!entry || now - entry.start > WINDOW_SIZE) {
		entry = { count: 1, start: now };
	} else {
		entry.count++;
	}
	if (entry.count > MAX_REQUESTS) {
		rateLimitMap.set(ip, entry);
		return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
			status: 429,
			headers: { "Content-Type": "application/json" },
		});
	}
	rateLimitMap.set(ip, entry);

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
