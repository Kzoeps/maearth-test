import React, { useEffect, useMemo, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { useBlueskyAuth } from "./providers/bluesky-provider";
import type { ImpactClaim } from "./components/Form";
import {
  listImpactClaims,
  type ListImpactClaimsResult,
} from "./api/create-impact";

type ListedClaim = ImpactClaim & { uri: string };

export default function HypercertsListPage() {
  const { session, isReady } = useBlueskyAuth();

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ListedClaim[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [history, setHistory] = useState<(string | null)[]>([]); // for Back support
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (nextCursor: string | null, pushHistory: boolean) => {
      if (!session) return;
      setLoading(true);
      setError(null);
      try {
        const res: ListImpactClaimsResult = await listImpactClaims(session, {
          cursor: nextCursor,
          limit: 20,
          reverse: true,
        });
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
    [session]
  );

  useEffect(() => {
    if (isReady && session) {
      fetchPage(null, true);
    }
  }, [isReady, session, fetchPage]);

  const handleNext = () => fetchPage(cursor ?? null, true);

  const handleBack = () => {
    // pop current cursor, go to previous
    setHistory((h) => {
      if (h.length <= 1) return h; // nothing to go back to
      const nextHistory = h.slice(0, -1);
      const prevCursor = nextHistory[nextHistory.length - 1] ?? null;
      // Fetch without re-pushing history (we already have it)
      fetchPage(prevCursor, false);
      return nextHistory;
    });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      const hay = JSON.stringify(it).toLowerCase();
      return hay.includes(q);
    });
  }, [items, query]);

  if (!isReady) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-12 text-zinc-300">
        Preparing session…
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-12 text-zinc-300">
        Please sign in to view your hypercerts.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          <span className="bg-clip-text text-transparent bg-[conic-gradient(at_30%_50%,#60a5fa,65%,#a78bfa_85%,#22d3ee)]">
            Your Hypercerts
          </span>
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Listing records from{" "}
          <code className="font-mono">org.hypercert.impactClaims</code>
        </p>
      </header>

      <section className="rounded-2xl border border-zinc-800/70 bg-zinc-950/70 supports-[backdrop-filter]:backdrop-blur-md shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset,0_20px_60px_-20px_rgba(0,0,0,0.7)] p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 mb-4">
          <div className="flex-1">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search (id, scope, uri, contributor, etc.)"
              className="w-full rounded-2xl bg-white/10 border border-white/25 px-3 py-3 outline-none placeholder:text-white/50 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] focus:ring-2 focus:ring-sky-400/70 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBack}
              disabled={loading || history.length <= 1}
              className="rounded-xl border border-white/20 bg-white/5 px-3 py-2.5 text-sm hover:bg-white/10 disabled:opacity-40"
              title="Previous page"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={loading || !cursor}
              className="rounded-xl bg-white text-black font-semibold px-3 py-2.5 hover:opacity-90 disabled:opacity-40"
              title="Next page"
            >
              Next →
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-10 text-zinc-400">
            Loading…
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-rose-200">
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-zinc-400 py-10 text-center">
            No hypercerts found.
          </div>
        )}

        <ul className="grid gap-4">
          {filtered.map((item) => (
            <li
              key={item.uri}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 text-black text-xs font-semibold px-2 py-1">
                      Impact Claim
                    </span>
                    <code className="text-xs text-white/70 break-all">
                      {item.uri}
                    </code>
                  </div>

                  <h3 className="mt-2 text-lg font-semibold break-words">
                    {item.impact_claim_id || "(no id)"}
                  </h3>

                  <p className="text-sm text-white/80 break-words">
                    {item.work_scope}
                  </p>

                  {item.description && (
                    <p className="mt-2 text-sm text-white/70 break-words">
                      {item.description}
                    </p>
                  )}

                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    <MetaRow label="Work start">
                      <Time iso={item.work_start_time} />
                    </MetaRow>
                    <MetaRow label="Work end">
                      <Time iso={item.work_end_time} />
                    </MetaRow>
                    <MetaRow label="URIs">
                      <ul className="list-disc list-inside space-y-1">
                        {item.uri && Array.isArray(item.uri) ? (
                          (item.uri as any).map((u: string, idx: number) => (
                            <li key={idx} className="truncate">
                              <a
                                href={u}
                                target="_blank"
                                rel="noreferrer"
                                className="underline decoration-white/30 hover:decoration-white"
                              >
                                {u}
                              </a>
                            </li>
                          ))
                        ) : (
                          <li className="text-white/60">—</li>
                        )}
                      </ul>
                    </MetaRow>
                    <MetaRow label="Contributors">
                      {item.contributors_uri &&
                      item.contributors_uri.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1">
                          {item.contributors_uri.map((c, idx) => (
                            <li key={idx} className="truncate">
                              <a
                                href={c.startsWith("http") ? c : undefined}
                                target={
                                  c.startsWith("http") ? "_blank" : undefined
                                }
                                rel={
                                  c.startsWith("http")
                                    ? "noreferrer"
                                    : undefined
                                }
                                className={
                                  c.startsWith("http")
                                    ? "underline decoration-white/30 hover:decoration-white"
                                    : ""
                                }
                              >
                                {c}
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-white/60">—</span>
                      )}
                    </MetaRow>
                    <MetaRow label="Rights">
                      {item.rights_uri ? (
                        <a
                          href={item.rights_uri}
                          target="_blank"
                          rel="noreferrer"
                          className="underline decoration-white/30 hover:decoration-white break-all"
                        >
                          {item.rights_uri}
                        </a>
                      ) : (
                        <span className="text-white/60">—</span>
                      )}
                    </MetaRow>
                    <MetaRow label="Location">
                      {item.location_uri ? (
                        <a
                          href={item.location_uri}
                          target="_blank"
                          rel="noreferrer"
                          className="underline decoration-white/30 hover:decoration-white break-all"
                        >
                          {item.location_uri}
                        </a>
                      ) : (
                        <span className="text-white/60">—</span>
                      )}
                    </MetaRow>
                  </div>
                </div>

                {/* Compact JSON toggle */}
                <details className="w-full md:w-[320px] rounded-xl border border-white/10 bg-black/40 p-3">
                  <summary className="cursor-pointer text-sm text-white/80">
                    Raw JSON
                  </summary>
                  <pre className="mt-2 text-xs text-white/70 overflow-auto max-h-64">
                    {JSON.stringify(item, null, 2)}
                  </pre>
                </details>
              </div>
            </li>
          ))}
        </ul>

        {/* Pager info */}
        <div className="mt-6 flex items-center justify-between text-xs text-white/60">
          <div>
            Page history: {history.length} • Showing {filtered.length} items
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBack}
              disabled={loading || history.length <= 1}
              className="rounded-xl border border-white/20 bg-white/5 px-3 py-2.5 hover:bg-white/10 disabled:opacity-40"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={loading || !cursor}
              className="rounded-xl bg-white text-black font-semibold px-3 py-2.5 hover:opacity-90 disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function MetaRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-3">
      <div className="text-[11px] uppercase tracking-wide text-white/50">
        {label}
      </div>
      <div className="mt-1 text-sm text-white/90 break-words">{children}</div>
    </div>
  );
}

function Time({ iso }: { iso: string }) {
  if (!iso) return <span className="text-white/60">—</span>;
  const d = new Date(iso);
  const s = isNaN(d.getTime()) ? iso : d.toLocaleString();
  return <span>{s}</span>;
}
