import React, { useContext } from "react";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { PropsWithChildren } from "react";
import {
  BrowserOAuthClient,
  type OAuthSession,
} from "@atproto/oauth-client-browser";
import { METADATA } from "../constants";
import { useNavigate } from "@tanstack/react-router";

/**
 * Context shape
 */
export type BlueskyAuthContextValue = {
  client: BrowserOAuthClient | null;
  session: OAuthSession | null;
  state?: string;
  isReady: boolean;
  error?: unknown;

  // helpers
  signIn: (
    handleOrEmailOrDidOrPds: string,
    opts?: { state?: string }
  ) => Promise<never>; // redirects
  signOut: () => Promise<void>;
};

export const BlueskyAuthContext = createContext<BlueskyAuthContextValue>({
  client: null,
  session: null,
  isReady: false,
  signIn: async () => {
    // This never resolves because it redirects
    throw new Error("BlueskyAuthProvider not mounted yet.");
  },
  signOut: async () => {
    throw new Error("BlueskyAuthProvider not mounted yet.");
  },
});

function isEmail(input: string) {
  return /\S+@\S+\.\S+/.test(input);
}

async function resolveHandleFromEmail(email: string): Promise<string | null> {
  const origin = window.location.origin;
  const url = `${origin}/api/searchAccounts?email=${encodeURIComponent(email)}`;

  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    // 404 means “not found” from your endpoint
    if (res.status === 404) return null;
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`Account lookup failed: ${res.status} ${errText}`);
  }

  // Your endpoint returns: { handle: string, did: string }
  const data = (await res.json()) as { handle?: string; did?: string };
  return data.handle ?? null;
}

/**
 * Provider
 */
export function BlueskyAuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<OAuthSession | null>(null);
  const [state, setState] = useState<string | undefined>(undefined);
  const [error, setError] = useState<unknown>(undefined);
  const navigate = useNavigate();
  const [isReady, setIsReady] = useState(false);
  // Keep a stable client instance
  const clientRef = useRef<BrowserOAuthClient | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        clientRef.current = new BrowserOAuthClient({
          clientMetadata: METADATA,
          // removed hardcoded handleResolver / PDS — let the client resolve normally
        });

        const result = await clientRef.current.init();
        if (!cancelled && result?.session) {
          setSession(result.session);
          // @ts-expect-error: state is transient and may be present post-auth
          setState(result.state);
        }
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setIsReady(true);
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  // Helpers
  const signIn = useCallback<BlueskyAuthContextValue["signIn"]>(
    async (handleOrEmailOrDidOrPds: string, opts) => {
      const c = clientRef.current;
      if (!c) throw new Error("OAuth client not ready");

      let loginTarget = handleOrEmailOrDidOrPds;

      if (isEmail(handleOrEmailOrDidOrPds)) {
        // resolve email -> handle via your API
        const handle = await resolveHandleFromEmail(handleOrEmailOrDidOrPds);
        if (!handle) {
          navigate({
            to: `/signup`,
            search: { email: loginTarget },
          });
        }
        loginTarget = handle || ""; // use resolved handle for OAuth
      }

      // NOTE: pass the (handle|did|pds) directly; no hardcoded PDS URL
      if (loginTarget) {
        return c.signIn(loginTarget, {
          state: opts?.state,
        });
      }
      return Promise.reject(new Error("Invalid login identifier"));
    },
    []
  );

  const signOut = useCallback(async () => {
    const browserClient = clientRef.current;
    if (!browserClient) return;
    if (session) {
      localStorage.clear();
      sessionStorage.clear();
    }
    setSession(null);
    setState(undefined);
  }, [session]);

  const value = useMemo<BlueskyAuthContextValue>(
    () => ({
      client: clientRef.current,
      session,
      state,
      isReady,
      error,
      signIn,
      signOut,
    }),
    [session, state, isReady, error, signIn, signOut]
  );

  return (
    <BlueskyAuthContext.Provider value={value}>
      {children}
    </BlueskyAuthContext.Provider>
  );
}

export function useBlueskyAuth() {
  return useContext(BlueskyAuthContext);
}
