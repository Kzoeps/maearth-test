const PDS_ORIGIN = process.env.PDS_ORIGIN ?? "https://hypercerts.climateai.org";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

type CreateReq = {
  email?: string;
  handle?: string;
  password?: string;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function POST(request: Request) {
  const { email, handle, password } = (await request.json()) as CreateReq;

  if (!email || !handle || !password) {
    return json(
      {
        error: "Missing required fields",
        required: ["email", "handle", "password"],
      },
      400
    );
  }

  if (!ADMIN_PASSWORD) {
    return json(
      { error: "Server misconfigured: ADMIN_PASSWORD is not set" },
      500
    );
  }

  // 1) Create an invite code (requires admin basic auth)
  const inviteUrl = new URL(
    "/xrpc/com.atproto.server.createInviteCode",
    PDS_ORIGIN
  ).toString();

  const basic = Buffer.from(`admin:${ADMIN_PASSWORD}`).toString("base64");

  const inviteRes = await fetch(inviteUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Basic ${basic}`,
    },
    body: JSON.stringify({ useCount: 1 }),
  });

  if (!inviteRes.ok) {
    const err = await inviteRes.text().catch(() => inviteRes.statusText);
    return json(
      {
        error: "PDS createInviteCode failed",
        status: inviteRes.status,
        detail: err,
      },
      inviteRes.status
    );
  }

  const inviteData = (await inviteRes.json()) as { code?: string };
  const inviteCode = inviteData.code;
  if (!inviteCode) {
    return json({ error: "Invite code missing in PDS response" }, 502);
  }

  // 2) Create account with the invite code
  const createUrl = new URL(
    "/xrpc/com.atproto.server.createAccount",
    PDS_ORIGIN
  ).toString();

  const payload = { email, handle, password, inviteCode };

  const createRes = await fetch(createUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!createRes.ok) {
    const err = await createRes.text().catch(() => createRes.statusText);
    return json(
      {
        error: "PDS createAccount failed",
        status: createRes.status,
        detail: err,
      },
      createRes.status
    );
  }

  const data = await createRes.json();
  return json(data, 200);
}
