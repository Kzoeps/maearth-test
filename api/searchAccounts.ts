const adminPassword = process.env.ADMIN_PASSWORD;
const pdsOrigin = process.env.PDS_ORIGIN ?? "https://hypercerts.climateai.org";

if (!adminPassword) {
  console.warn("ADMIN_PASSWORD is not set");
}

const basic = Buffer.from(`admin:${adminPassword ?? ""}`).toString("base64");

type ListReposResp = {
  repos: Array<{ did: string }>;
  cursor?: string;
};

type AccountInfo = {
  handle: string;
  email?: string;
  did: string;
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`${url} -> ${res.status} ${err}`);
  }
  return res.json() as Promise<T>;
}

// simple concurrency limiter to avoid hammering the admin API
async function mapWithConcurrency<I, O>(
  items: I[],
  limit: number,
  fn: (item: I) => Promise<O>
): Promise<O[]> {
  const ret: O[] = [];
  let i = 0;

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        ret[idx] = await fn(items[idx]);
      }
    })
  );

  return ret;
}

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const email = searchParams.get("email");

  if (!email) {
    return new Response('Missing "email" query parameter', { status: 400 });
  }
  if (!adminPassword) {
    return new Response("Server misconfigured: ADMIN_PASSWORD missing", {
      status: 500,
    });
  }

  // 1) Mirror the Bash `list`: list repos (no auth), limit=100 (no pagination to match script)
  const listURL = new URL("/xrpc/com.atproto.sync.listRepos", pdsOrigin);
  listURL.searchParams.set("limit", "100");

  const list = await fetchJson<ListReposResp>(listURL.toString());

  // 2) For each DID, call admin.getAccountInfo (with Basic auth)
  const dids = list.repos.map((r) => r.did);

  const accounts = await mapWithConcurrency(dids, 10, async (did) => {
    const infoURL = new URL(
      "/xrpc/com.atproto.admin.getAccountInfo",
      pdsOrigin
    );
    infoURL.searchParams.set("did", did);

    return fetchJson<AccountInfo>(infoURL.toString(), {
      method: "GET",
      headers: { Authorization: `Basic ${basic}` },
    }).catch(() => null as unknown as AccountInfo); // tolerate individual failures like the Bash does
  });

  // 3) Find by email (case-insensitive), return the handle
  const target = accounts.find(
    (a) => a && a.email && a.email.toLowerCase() === email.toLowerCase()
  );

  if (!target) {
    return Response.json(
      { error: "Account not found for email", email },
      { status: 404 }
    );
  }

  return Response.json({ handle: target.handle, did: target.did });
}
