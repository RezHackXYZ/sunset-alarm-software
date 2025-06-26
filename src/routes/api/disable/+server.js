import { supabase } from "$lib/supabase.server.js";

export async function GET() {
	await supabase
		.from("Logs")
		.insert([{ EventType: "testOnOrOff", ChangeTo: "false" }])
		.select();

}