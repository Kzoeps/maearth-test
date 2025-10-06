// atp.ts
import { AtpAgent, type AtpSessionData } from "@atproto/api";

const PDS_URL = "https://hypercerts.climateai.org";
const STORAGE_KEY = "atp-session";

let _agent: AtpAgent | null = null;

/** SSR-safe localStorage helpers */
function loadSession(): AtpSessionData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AtpSessionData) : null;
  } catch {
    return null;
  }
}
function saveSession(sess: AtpSessionData | null) {
  if (typeof window === "undefined") return;
  try {
    if (sess) localStorage.setItem(STORAGE_KEY, JSON.stringify(sess));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Create (once) and return the singleton agent. */
export function getAgent(): AtpAgent {
  if (_agent) return _agent;
  _agent = new AtpAgent({ service: PDS_URL });
  return _agent;
}

/** Try to resume a session from storage on first use. Safe to call multiple times. */
let _resumeOnce: Promise<void> | null = null;
export async function ensureResumed(): Promise<void> {
  if (_resumeOnce) return _resumeOnce;
  _resumeOnce = (async () => {
    const agent = getAgent();
    const saved = loadSession();
    if (!saved) return;
    try {
      await agent.resumeSession(saved);
      // Agent may refresh tokens; persist the latest snapshot if present
      if (agent.session) saveSession(agent.session);
    } catch {
      // If resume fails (expired/invalid), clear storage
      saveSession(null);
    }
  })();
  return _resumeOnce;
}

/** Email+password login that authenticates the singleton agent. */
export async function login(identifier: string, password: string) {
  const agent = getAgent();
  await agent.login({ identifier, password });
  if (!agent.session)
    throw new Error("Login succeeded but no session returned");
  saveSession(agent.session);
  return agent.session;
}

/** Logout and clear persisted session. */
export async function logout() {
  const agent = getAgent();
  try {
    await agent.logout();
  } finally {
    saveSession(null);
  }
}

/** Current session snapshot (may be null). */
export function getSession(): AtpSessionData | null {
  return getAgent().session ?? null;
}
