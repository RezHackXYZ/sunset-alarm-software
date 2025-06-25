import { supabase } from '$lib/supabase.server.js';

export async function GET() {
    await supabase
	.from("AlarmStatus")
	.insert([{ Value: false }])
	.select();

}