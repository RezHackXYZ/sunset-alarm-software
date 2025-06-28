import { createClient } from "@supabase/supabase-js";
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from "$env/static/public";

// For client-side, we need to use PUBLIC_ prefixed environment variables
// You'll need to add these to your .env file:
// PUBLIC_SUPABASE_URL=your_supabase_url
// PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

let supabase = null;

// Only initialize Supabase client in the browser
if (typeof window !== 'undefined') {
	console.log('Debug - PUBLIC_SUPABASE_URL:', PUBLIC_SUPABASE_URL ? 'Found' : 'Missing');
	console.log('Debug - PUBLIC_SUPABASE_ANON_KEY:', PUBLIC_SUPABASE_ANON_KEY ? 'Found' : 'Missing');
	
	if (PUBLIC_SUPABASE_URL && PUBLIC_SUPABASE_ANON_KEY) {
		supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
		console.log('Debug - Supabase client created successfully');
	} else {
		console.warn('Supabase environment variables not found. Notifications will not work.');
	}
}

export { supabase }; 