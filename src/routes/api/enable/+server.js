export async function GET() {
	try {
		const response = await fetch("http://192.168.4.134/enable");
		if (!response.ok) {
			return new Response(JSON.stringify({ error: `HTTP error! status: ${response.status}` }), {
				status: response.status,
				headers: { "Content-Type": "application/json" },
			});
		}
		const data = await response.json();
		return new Response(JSON.stringify(data), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("There was a problem with the fetch operation:", error);
		return new Response(JSON.stringify({ error: "Internal Server Error" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
}
