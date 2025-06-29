import { json } from '@sveltejs/kit';

export async function GET() {
	return json({
		message: 'Environment variables test',
		env_vars: {
			VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY ? 'SET' : 'NOT SET',
			VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY ? 'SET' : 'NOT SET',
			VAPID_EMAIL: process.env.VAPID_EMAIL || 'NOT SET',
			NODE_ENV: process.env.NODE_ENV,
			all_env_keys: Object.keys(process.env).filter(key => key.includes('VAPID'))
		}
	});
} 