import { supabase } from "$lib/supabase.server.js";

const clients = new Set();

// only run subscription once
let isSubscribed = false;
if (!isSubscribed) {
	isSubscribed = true;

	supabase
		.channel("realtime-mirror")
		.on("postgres_changes", { event: "INSERT", schema: "public", table: "Logs" }, (payload) => {
			const msg = `data: ${JSON.stringify(payload)}\n\n`;
			for (const res of clients) {
				try {
					res.write(msg);
				} catch {
					clients.delete(res);
				}
			}
		})
		.subscribe();
}

export async function GET() {
	const stream = new ReadableStream({
		start(controller) {
			const encoder = new TextEncoder();
			const write = (msg) => controller.enqueue(encoder.encode(msg));

			const client = {
				write,
				close: () => controller.close(),
			};

			clients.add(client);
			write(`event: open\ndata: connected\n\n`);
		},
	});

	return new Response(stream, {
		headers: {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache",
			Connection: "keep-alive",
		},
	});
}
