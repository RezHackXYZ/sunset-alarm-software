import { supabase } from "$lib/supabase.server.js";
let clients = [];

function broadcastToClients(data) {
	const payload = `data: ${JSON.stringify(data)}\n\n`;
	for (const client of clients) {
		try {
			client.enqueue(payload);
		} catch (err) {
			console.error("❌ dead SSE client", err);
		}
	}
}

supabase
	.channel("mirror-realtime")
	.on(
		"postgres_changes",
		{ event: "INSERT", schema: "public", table: "AlarmStatus" },
		(payload) => {
			broadcastToClients(payload);
		},
	)
	.subscribe();

export function GET() {
	const stream = new ReadableStream({
		start(controller) {
			clients.push(controller);

			const keepAlive = setInterval(() => {
				controller.enqueue(":\n\n");
			}, 15_000);

			// @ts-ignore
			controller.onCancel = () => {
				clearInterval(keepAlive);
				clients = clients.filter((c) => c !== controller);
			};
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
