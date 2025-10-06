import {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useSyncExternalStore,
} from "react";
import React from "react";
import CreateHypercertForm, { type ImpactClaim } from "./components/Form";
import { createImpactClaimviaAtpAgent } from "./api/create-impact";
import { getAgent, ensureResumed, login, logout, getSession } from "./atp";
import toast from "react-hot-toast";

function useAtpSession() {
  // simple external store to re-render when we change session
  // we’ll just poll session from agent after our own login/logout ops
  const subscribe = useCallback((cb: () => void) => {
    // no native events; just return a noop unsubscriber
    // you can enhance by emitting custom events in login/logout helpers
    return () => {};
  }, []);
  const getSnapshot = useCallback(() => getSession(), []);
  const session = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return session;
}

function EmailLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);

  const session = useAtpSession();
  const agent = getAgent();

  useEffect(() => {
    (async () => {
      await ensureResumed();
      setBootstrapping(false);
    })();
  }, []);

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);
  const emailValid = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail),
    [normalizedEmail]
  );
  const canLogin = emailValid && password.length >= 6 && !isSubmitting;

  const onSignIn = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!canLogin) return;
      try {
        setIsSubmitting(true);
        await login(normalizedEmail, password);
        toast.success("Signed in!");
      } catch (err: any) {
        console.error(err);
        toast.error(err?.message ?? "Failed to sign in");
      } finally {
        setIsSubmitting(false);
      }
    },
    [canLogin, normalizedEmail, password]
  );

  const onSignOut = useCallback(async () => {
    await logout();
    toast("Signed out");
  }, []);

  const handleCreate = useCallback(
    async (record: ImpactClaim) => {
      if (!session) {
        toast.error("Please sign in first.");
        return;
      }
      try {
        await createImpactClaimviaAtpAgent(agent, record); // uses the already-authenticated singleton
        toast.success("Created Impact Claim!");
      } catch (e: any) {
        console.error(e);
        toast.error(e?.message ?? "Failed to create impact claim");
      }
    },
    [agent, session]
  );

  return (
    <div className="min-h-[100svh] bg-black text-white relative overflow-x-clip">
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
              Sign in to Hypercerts
            </span>
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Use your email and password, then create an impact claim
            (hypercert).
          </p>
        </header>

        <section className="relative rounded-2xl border border-zinc-800/70 bg-zinc-950/70 supports-[backdrop-filter]:backdrop-blur-md shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset,0_20px_60px_-20px_rgba(0,0,0,0.7)] p-6 md:p-8">
          {bootstrapping ? (
            <div className="flex items-center justify-center py-16 text-zinc-300">
              <svg
                className="h-4 w-4 animate-spin mr-3"
                viewBox="0 0 24 24"
                fill="none"
              >
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
              Restoring session…
            </div>
          ) : session ? (
            <div className="space-y-8">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 grid place-items-center font-bold">
                    {(session.did?.[0] ?? "U").toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm text-zinc-300">Signed in as</p>
                    <p className="font-mono text-sm md:text-base break-all">
                      {session.handle ?? session.did}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onSignOut}
                  className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 font-semibold hover:bg-zinc-800 active:scale-[0.99] transition"
                >
                  Sign out
                </button>
              </div>

              <div className="h-px w-full bg-zinc-800/80" />
              <CreateHypercertForm onSubmit={handleCreate} />
            </div>
          ) : (
            <form onSubmit={onSignIn} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs uppercase tracking-wide text-zinc-400 mb-2"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  placeholder="you@example.com"
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-3 py-3 outline-none focus:ring-2 focus:ring-sky-400/60 focus:border-transparent placeholder:text-zinc-400 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs uppercase tracking-wide text-zinc-400 mb-2"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-3 py-3 outline-none focus:ring-2 focus:ring-sky-400/60 focus:border-transparent placeholder:text-zinc-400 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="mt-2 text-xs text-zinc-500">
                  Must be at least 6 characters.
                </p>
              </div>

              <button
                type="submit"
                disabled={!canLogin}
                className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-3 font-semibold text-black shadow-[0_8px_24px_-8px_rgba(56,189,248,0.6)] hover:opacity-95 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed transition inline-flex items-center justify-center gap-2"
              >
                {isSubmitting && (
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
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
                )}
                <span>Sign in</span>
              </button>
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

export default EmailLogin;
