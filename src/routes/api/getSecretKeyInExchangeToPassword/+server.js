import { supabase } from "$lib/supabase.server.js";
import { SUPABASE_SERVICE_ROLE_KEY } from "$env/static/private";

export async function GET({ url }) {
	const password = url.searchParams.get("password");

	const { data, error } = await supabase
		.from("authorizedPasswords")
		.select("password")
		.eq("password", password);

	if (error) {
		return new Response("Internal Server Error", { status: 500 });
	}

	if (!data || data.length === 0) {
		return new Response("Wrong Password", { status: 401 });
	}

	return new Response(SUPABASE_SERVICE_ROLE_KEY, { status: 200 });
}
