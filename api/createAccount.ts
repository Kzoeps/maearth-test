const PDS_ORIGIN = process.env.PDS_ORIGIN ?? "https://hypercerts.climateai.org";

type CreateReq = {
  email?: string;
  handle?: string;
  password?: string;
};

export async function POST(request: Request) {
  const { email, handle, password } = (await request.json()) as CreateReq;

  if (!email || !handle || !password) {
    return new Response(
      JSON.stringify({
        error: "Missing required fields",
        required: ["email", "handle", "password"],
      }),
      { status: 400, headers: { "content-type": "application/json" } }
    );
  }

  const url = new URL(
    "/xrpc/com.atproto.server.createAccount",
    PDS_ORIGIN
  ).toString();

  // IMPORTANT: send ONLY these three fields
  const payload = { email, handle, password };

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  // Pass through PDS error text to help debugging
  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    return new Response(
      JSON.stringify({
        error: "PDS createAccount failed",
        status: res.status,
        detail: err,
      }),
      { status: res.status, headers: { "content-type": "application/json" } }
    );
  }

  const data = await res.json();
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
