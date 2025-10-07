const adminPassword = process.env.ADMIN_PASSWORD;
const basic = Buffer.from(`admin:${adminPassword}`).toString("base64");

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const pdsURL = new URL(
    "https://hypercerts.climateai.org/xrpc/com.atproto.admin.searchAccounts"
  );

  if (searchParams.get("email")) {
    pdsURL.searchParams.set("email", searchParams.get("email")!);
  }

  const res = await fetch(pdsURL.toString(), {
    method: "GET",
    headers: { Authorization: `Basic ${basic}` },
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`PDS admin search failed: ${res.status} ${err}`);
  }
  return res.json() as Promise<{ accounts: unknown[]; cursor?: string }>;
}
