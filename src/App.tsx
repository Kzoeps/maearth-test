import { useState, useMemo, useCallback, useEffect } from "react";
import React from "react";
import { useBlueskyAuth } from "./providers/bluesky-provider";
import CreateHypercertForm, { type ImpactClaim } from "./components/Form";
import { createImpactClaim } from "./api/create-impact";
import toast from "react-hot-toast";

/**
 * =====================
 * App.tsx (updated)
 * - Fixes scroll jank (no fixed backgrounds, uses 100svh)
 * - Higher-contrast inputs handled in Form via tokens
 * - Safer sticky only at lg+
 * =====================
 */
function App() {
  const { signIn, signOut, session, isReady, state } = useBlueskyAuth();
  const [handle, setHandle] = useState("");

  const normalized = useMemo(() => handle.trim().replace(/^@/, ""), [handle]);
  const canLogin = normalized.length > 0 && isReady;

  const onSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!canLogin) return;
      signIn(normalized, { state: "bsky:direct-login" });
    },
    [canLogin, normalized, signIn]
  );

  useEffect(() => {
    if (state) console.debug("Bluesky OAuth state:", state);
  }, [state]);

  // 🔗 Hook up the hypercert form submit
  const handleCreate = useCallback(
    async (record: ImpactClaim) => {
      console.log("creating impact claim");
      if (!session) return;
      await createImpactClaim(session, record);
      toast.success("Created Impact Claim!");
    },
    [session]
  );

  return (
    <div className="min-h-[100svh] bg-black text-white relative overflow-x-clip">
      {/* Background: use absolutely-positioned layers (not fixed) to avoid repaint-jank */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(800px_600px_at_70%_20%,#1e1e1e_0%,#0a0a0a_60%,#000_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(transparent_24px,rgba(255,255,255,0.04)_25px),linear-gradient(90deg,transparent_24px,rgba(255,255,255,0.04)_25px)] bg-[size:26px_26px] mix-blend-screen"
      />

      <main className="mx-auto max-w-5xl px-6 py-14">
        <header className="mb-10">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            <span className="bg-clip-text text-transparent bg-[conic-gradient(at_30%_50%,#60a5fa,65%,#a78bfa_85%,#22d3ee)]">
              Connect to Hypercerts
            </span>
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Sign in, then create an impact claim (hypercert).
          </p>
        </header>

        <section className="relative rounded-2xl border border-zinc-800/70 bg-zinc-950/70 supports-[backdrop-filter]:backdrop-blur-md shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset,0_20px_60px_-20px_rgba(0,0,0,0.7)] p-6 md:p-8">
          {!isReady ? (
            <div className="flex items-center justify-center py-16">
              <SpinnerLabel label="Preparing Bluesky OAuth…" />
            </div>
          ) : session ? (
            <div className="space-y-8">
              {/* Signed-in DID strip (kept) */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 grid place-items-center font-bold">
                    {(session.sub?.[0] ?? "U").toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm text-zinc-300">Signed in as</p>
                    <p className="font-mono text-sm md:text-base break-all">
                      {session.sub}
                    </p>
                    {state && (
                      <p className="text-xs text-zinc-500 mt-1">
                        state: <span className="font-mono">{state}</span>
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={signOut}
                  className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 font-semibold hover:bg-zinc-800 active:scale-[0.99] transition"
                >
                  Sign out
                </button>
              </div>

              {/* Divider */}
              <div className="h-px w-full bg-zinc-800/80" />

              {/* Hypercert creation form */}
              <CreateHypercertForm onSubmit={handleCreate} />
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="bsky"
                  className="block text-xs uppercase tracking-wide text-zinc-400 mb-2"
                >
                  Hypercerts handle | Email
                </label>
                <div className="relative">
                  <input
                    id="bsky"
                    type="text"
                    autoCapitalize="none"
                    autoCorrect="off"
                    className="w-full rounded-2xl border border-white/20 bg-white/10 pl-8 pr-3 py-3 outline-none focus:ring-2 focus:ring-sky-400/60 focus:border-transparent placeholder:text-zinc-400 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                  />
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  Use your full handle (e.g.{" "}
                  <code className="font-mono">
                    yourname.hypercerts.climateai.org
                  </code>
                  ). or Your email <code>kzoepa@hypercerts.org</code>
                </p>
              </div>

              <button
                type="submit"
                disabled={!canLogin}
                className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-3 font-semibold text-black shadow-[0_8px_24px_-8px_rgba(56,189,248,0.6)] hover:opacity-95 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Continue with Hypercerts
              </button>

              <p className="text-center text-xs text-zinc-500">
                You’ll be redirected to Hypercerts to authorize.
              </p>
            </form>
          )}
        </section>

        <footer className="mt-10 text-center text-xs text-zinc-500">
          © {new Date().getFullYear()} — Sign-in portal
        </footer>
      </main>
    </div>
  );
}

function SpinnerLabel({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center gap-3 text-zinc-300">
      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          strokeWidth="2"
          className="opacity-30"
        />
        <path
          d="M21 12a9 9 0 0 1-9 9"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <span className="text-sm">{label}</span>
    </div>
  );
}

export default App;
