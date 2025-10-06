import React, { useEffect, useMemo, useState, useCallback } from "react";
import toast from "react-hot-toast";
import type { ImpactClaim } from "./components/Form";
import {
  listImpactClaimsViaAtpAgent,
  type ListImpactClaimsResult,
} from "./api/create-impact";
import { getAgent, ensureResumed } from "./atp";

type ListedClaim = ImpactClaim & { uri: string };

export default function CertsEmailList() {
  const agent = getAgent();

  const [bootstrapping, setBootstrapping] = useState(true);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ListedClaim[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [history, setHistory] = useState<(string | null)[]>([]); // for Back support
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isReady = !bootstrapping;
  const session = agent.session ?? null;

  const fetchPage = useCallback(
    async (nextCursor: string | null, pushHistory: boolean) => {
      if (!agent.session) return; // not signed in
      setLoading(true);
      setError(null);
      try {
        const res: ListImpactClaimsResult = await listImpactClaimsViaAtpAgent(
          agent,
          {
            cursor: nextCursor,
            limit: 20,
            reverse: true,
          }
        );
        setItems(res.items);
        setCursor(res.cursor ?? null);
        if (pushHistory) {
          setHistory((h) => [...h, nextCursor]);
        }
      } catch (e) {
        console.error(e);
        const msg = "Failed to load hypercerts.";
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    },
    [agent]
  );

  useEffect(() => {
    (async () => {
      await ensureResumed(); // try resuming saved session once
      setBootstrapping(false);
    })();
  }, []);

  useEffect(() => {
    if (isReady && session) {
      fetchPage(null, true);
    }
  }, [isReady, session, fetchPage]);

  const handleNext = () => fetchPage(cursor ?? null, true);

  const handleBack = () => {
    setHistory((h) => {
      if (h.length <= 1) return h;
      const nextHistory = h.slice(0, -1);
      const prevCursor = nextHistory[nextHistory.length - 1] ?? null;
      fetchPage(prevCursor, false);
      return nextHistory;
    });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => JSON.stringify(it).toLowerCase().includes(q));
  }, [items, query]);

  // --------- RENDER ---------

  if (!isReady) {
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
          <div className="flex items-center justify-center py-16">
            <SpinnerLabel label="Preparing session…" />
          </div>
        </main>
      </div>
    );
  }

  if (!session) {
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
          <section className="relative rounded-2xl border border-zinc-800/70 bg-zinc-950/70 supports-[backdrop-filter]:backdrop-blur-md shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset,0_20px_60px_-20px_rgba(0,0,0,0.7)] p-6 md:p-8">
            <div className="text-center py-16">
              <h2 className="text-xl font-semibold mb-2">
                Authentication Required
              </h2>
              <p className="text-zinc-400">
                Please sign in to view your hypercerts.
              </p>
            </div>
          </section>
        </main>
      </div>
    );
  }

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
              Your Hypercerts
            </span>
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Listing records from{" "}
            <code className="font-mono">org.hypercert.impactClaims</code>
          </p>
        </header>

        <section className="relative rounded-2xl border border-zinc-800/70 bg-zinc-950/70 supports-[backdrop-filter]:backdrop-blur-md shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset,0_20px_60px_-20px_rgba(0,0,0,0.7)] p-6 md:p-8">
          {/* Search & nav */}
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 mb-6">
            <div className="flex-1">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search (id, scope, uri, contributor, etc.)"
                className="w-full rounded-2xl border border-white/20 bg-white/10 px-3 py-3 outline-none focus:ring-2 focus:ring-sky-400/60 focus:border-transparent placeholder:text-zinc-400 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBack}
                disabled={loading || history.length <= 1}
                className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 font-semibold hover:bg-zinc-800 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed transition"
                title="Previous page"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={loading || !cursor}
                className="rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-3 font-semibold text-black shadow-[0_8px_24px_-8px_rgba(56,189,248,0.6)] hover:opacity-95 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed transition"
                title="Next page"
              >
                Next →
              </button>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-16">
              <SpinnerLabel label="Loading hypercerts…" />
            </div>
          )}

          {!loading && error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-200 mb-6">
              <div className="flex items-center gap-3">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </div>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="text-center py-16">
              <div className="h-16 w-16 rounded-2xl bg-zinc-800/50 mx-auto mb-4 grid place-items-center">
                <svg
                  className="h-8 w-8 text-zinc-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">
                No hypercerts found
              </h3>
              <p className="text-zinc-400">
                {query.trim()
                  ? "Try adjusting your search terms."
                  : "Create your first hypercert to get started."}
              </p>
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div className="space-y-4">
              {filtered.map((item) => (
                <div
                  key={item.uri}
                  className="rounded-2xl border border-zinc-800/70 bg-zinc-900/50 p-6 hover:bg-zinc-900/70 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 flex-wrap mb-4">
                        <span className="inline-flex items-center rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 text-black text-xs font-semibold px-3 py-1.5">
                          Impact Claim
                        </span>
                        <code className="text-xs text-zinc-400 break-all font-mono bg-zinc-800/50 px-2 py-1 rounded">
                          {item.uri}
                        </code>
                      </div>

                      <h3 className="text-xl font-semibold mb-3 break-words">
                        {item.impact_claim_id || "(no id)"}
                      </h3>

                      <p className="text-zinc-300 break-words mb-4">
                        {item.work_scope}
                      </p>

                      {item.description && (
                        <p className="text-sm text-zinc-400 break-words mb-6">
                          {item.description}
                        </p>
                      )}

                      <div className="grid gap-4 md:grid-cols-2">
                        <MetaCard label="Work Period">
                          <div className="space-y-1">
                            <div className="text-xs text-zinc-500">Start:</div>
                            <Time iso={item.work_start_time} />
                            <div className="text-xs text-zinc-500 mt-2">
                              End:
                            </div>
                            <Time iso={item.work_end_time} />
                          </div>
                        </MetaCard>

                        <MetaCard label="URIs">
                          {item.uri && Array.isArray(item.uri) ? (
                            <div className="space-y-2">
                              {(item.uri as any).map(
                                (u: string, idx: number) => (
                                  <a
                                    key={idx}
                                    href={u}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block text-sm text-sky-400 hover:text-sky-300 underline decoration-sky-400/30 hover:decoration-sky-300 truncate transition-colors"
                                  >
                                    {u}
                                  </a>
                                )
                              )}
                            </div>
                          ) : (
                            <span className="text-zinc-500">—</span>
                          )}
                        </MetaCard>

                        <MetaCard label="Contributors">
                          {item.contributors_uri &&
                          item.contributors_uri.length > 0 ? (
                            <div className="space-y-2">
                              {item.contributors_uri.map((c, idx) => (
                                <div key={idx}>
                                  {c.startsWith("http") ? (
                                    <a
                                      href={c}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="block text-sm text-sky-400 hover:text-sky-300 underline decoration-sky-400/30 hover:decoration-sky-300 truncate transition-colors"
                                    >
                                      {c}
                                    </a>
                                  ) : (
                                    <span className="block text-sm text-zinc-300 truncate">
                                      {c}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-zinc-500">—</span>
                          )}
                        </MetaCard>

                        <MetaCard label="Rights & Location">
                          <div className="space-y-3">
                            {item.rights_uri ? (
                              <div>
                                <div className="text-xs text-zinc-500 mb-1">
                                  Rights:
                                </div>
                                <a
                                  href={item.rights_uri}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-sm text-sky-400 hover:text-sky-300 underline decoration-sky-400/30 hover:decoration-sky-300 break-all transition-colors"
                                >
                                  {item.rights_uri}
                                </a>
                              </div>
                            ) : null}
                            {item.location_uri ? (
                              <div>
                                <div className="text-xs text-zinc-500 mb-1">
                                  Location:
                                </div>
                                <a
                                  href={item.location_uri}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-sm text-sky-400 hover:text-sky-300 underline decoration-sky-400/30 hover:decoration-sky-300 break-all transition-colors"
                                >
                                  {item.location_uri}
                                </a>
                              </div>
                            ) : null}
                            {!item.rights_uri && !item.location_uri && (
                              <span className="text-zinc-500">—</span>
                            )}
                          </div>
                        </MetaCard>
                      </div>
                    </div>

                    {/* Raw JSON toggle */}
                    <div className="lg:w-80 lg:flex-shrink-0">
                      <details className="rounded-2xl border border-zinc-800/70 bg-zinc-950/50 p-4">
                        <summary className="cursor-pointer text-sm text-zinc-300 hover:text-white transition-colors">
                          Raw JSON Data
                        </summary>
                        <pre className="mt-3 text-xs text-zinc-400 overflow-auto max-h-64 font-mono bg-black/30 p-3 rounded-xl border border-zinc-800/50">
                          {JSON.stringify(item, null, 2)}
                        </pre>
                      </details>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Footer */}
          {!loading && !error && filtered.length > 0 && (
            <>
              <div className="h-px w-full bg-zinc-800/80 my-8" />
              <div className="flex items-center justify-between">
                <div className="text-sm text-zinc-400">
                  Page {history.length} • Showing {filtered.length} items
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={loading || history.length <= 1}
                    className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 font-semibold hover:bg-zinc-800 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={loading || !cursor}
                    className="rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-3 font-semibold text-black shadow-[0_8px_24px_-8px_rgba(56,189,248,0.6)] hover:opacity-95 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    Next →
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        <footer className="mt-10 text-center text-xs text-zinc-500">
          © {new Date().getFullYear()} — Hypercerts Dashboard
        </footer>
      </main>
    </div>
  );
}

function MetaCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800/70 bg-zinc-950/50 p-4">
      <div className="text-xs uppercase tracking-wide text-zinc-500 mb-3">
        {label}
      </div>
      <div className="text-sm text-zinc-200">{children}</div>
    </div>
  );
}

function Time({ iso }: { iso: string }) {
  if (!iso) return <span className="text-zinc-500">—</span>;
  const d = new Date(iso);
  const s = isNaN(d.getTime()) ? iso : d.toLocaleString();
  return <span className="text-zinc-300">{s}</span>;
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
