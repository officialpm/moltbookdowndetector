"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export type HistoryProbeResult = {
  name: string;
  ok: boolean;
  ms: number;
  /** Optional endpoint category (site|api|docs|auth). */
  category?: string;
  /** HTTP status code (0 when fetch failed). */
  status?: number;
  /** Error string (e.g. "timeout") when fetch failed. */
  error?: string;
};

export type HistoryEntry = {
  timestamp: string;
  ok: boolean;
  totalMs: number;
  results: HistoryProbeResult[];
};

const STORAGE_KEY = "moltbook-status-history-v2";
const MAX_ENTRIES = 120;

function coerceHistoryEntry(x: unknown): HistoryEntry | null {
  if (!x || typeof x !== "object") return null;
  const obj = x as Record<string, unknown>;

  const timestamp = typeof obj.timestamp === "string" ? obj.timestamp : null;
  const ok = typeof obj.ok === "boolean" ? obj.ok : null;
  const totalMs = typeof obj.totalMs === "number" ? obj.totalMs : null;
  const resultsRaw = Array.isArray(obj.results) ? obj.results : null;

  if (!timestamp || ok === null || totalMs === null || !resultsRaw) return null;

  const results: HistoryProbeResult[] = resultsRaw
    .map((r) => {
      if (!r || typeof r !== "object") return null;
      const rr = r as Record<string, unknown>;
      const name = typeof rr.name === "string" ? rr.name : null;
      const rok = typeof rr.ok === "boolean" ? rr.ok : null;
      const ms = typeof rr.ms === "number" ? rr.ms : null;
      const category = typeof rr.category === "string" ? rr.category : undefined;
      const status = typeof rr.status === "number" ? rr.status : undefined;
      const error = typeof rr.error === "string" ? rr.error : undefined;
      if (!name || rok === null || ms === null) return null;
      return {
        name,
        ok: rok,
        ms,
        ...(category ? { category } : {}),
        ...(typeof status === "number" ? { status } : {}),
        ...(error ? { error } : {}),
      };
    })
    .filter((r): r is HistoryProbeResult => Boolean(r));

  return { timestamp, ok, totalMs, results };
}

export function useStatusHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setHistory(
            parsed
              .map(coerceHistoryEntry)
              .filter((e): e is HistoryEntry => Boolean(e)),
          );
        }
      } catch {
        // ignore
      }
      return;
    }

    // Best-effort migration from v1 (overall-only history).
    const legacy = localStorage.getItem("moltbook-status-history");
    if (!legacy) return;
    try {
      const parsed = JSON.parse(legacy);
      if (!Array.isArray(parsed)) return;
      const migrated: HistoryEntry[] = parsed
        .map((e) => {
          if (!e || typeof e !== "object") return null;
          const obj = e as Record<string, unknown>;
          const timestamp = typeof obj.timestamp === "string" ? obj.timestamp : null;
          const ok = typeof obj.ok === "boolean" ? obj.ok : null;
          const totalMs = typeof obj.totalMs === "number" ? obj.totalMs : null;
          if (!timestamp || ok === null || totalMs === null) return null;
          return { timestamp, ok, totalMs, results: [] as HistoryProbeResult[] };
        })
        .filter((e): e is HistoryEntry => Boolean(e));

      setHistory(migrated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    } catch {
      // ignore
    }
  }, []);

  const addEntry = useCallback((entry: HistoryEntry) => {
    setHistory((prev) => {
      const updated = [entry, ...prev].slice(0, MAX_ENTRIES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { history, addEntry, maxEntries: MAX_ENTRIES };
}

type ViewMode =
  | { kind: "overall" }
  | { kind: "endpoint"; endpointName: string };

function fmtTime(ts: string) {
  try {
    return new Date(ts).toLocaleTimeString();
  } catch {
    return ts;
  }
}

function getEndpointResult(entry: HistoryEntry, endpointName: string) {
  return entry.results.find((r) => r.name === endpointName) || null;
}

function percentile(values: number[], p: number) {
  if (values.length === 0) return Number.NaN;
  const sorted = values.slice().sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
  return sorted[idx];
}

function fmtMs(ms: number) {
  if (!Number.isFinite(ms)) return "—";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function fmtPct(x: number) {
  if (!Number.isFinite(x)) return "—";
  return `${Math.round(x * 100)}%`;
}

export default function StatusHistory({
  history,
  maxEntries,
}: {
  history: HistoryEntry[];
  maxEntries?: number;
}) {
  const endpointNames = useMemo(() => {
    const s = new Set<string>();
    for (const entry of history) {
      for (const r of entry.results || []) s.add(r.name);
    }
    return [...s].sort((a, b) => a.localeCompare(b));
  }, [history]);

  const router = useRouter();
  const searchParams = useSearchParams();

  const [view, setView] = useState<ViewMode>({ kind: "overall" });

  // Hydrate the endpoint view from the URL (shareable deep links).
  useEffect(() => {
    const sp = searchParams;
    if (!sp) return;
    const endpoint = sp.get("endpoint");
    if (endpoint) setView({ kind: "endpoint", endpointName: endpoint });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const effectiveView = useMemo<ViewMode>(() => {
    if (view.kind === "endpoint") {
      const stillExists = endpointNames.includes(view.endpointName);
      if (!stillExists) return { kind: "overall" };
    }
    return view;
  }, [endpointNames, view]);

  // Keep URL in sync when switching between overall/endpoint view.
  useEffect(() => {
    const sp = new URLSearchParams(searchParams?.toString() || "");
    if (effectiveView.kind === "endpoint") sp.set("endpoint", effectiveView.endpointName);
    else sp.delete("endpoint");

    const qs = sp.toString();
    router.replace(qs ? `/?${qs}` : "/");
  }, [router, searchParams, effectiveView]);

  const stats = useMemo(() => {
    const data = history
      .map((entry) => {
        if (effectiveView.kind === "overall") {
          const timeout = (entry.results || []).some((rr) => rr.error === "timeout");
          return { ok: entry.ok, ms: entry.totalMs, timeout };
        }
        const r = getEndpointResult(entry, effectiveView.endpointName);
        if (!r) return { ok: null as boolean | null, ms: Number.NaN, timeout: false };
        return { ok: r.ok, ms: r.ms, timeout: r.error === "timeout" };
      })
      .filter((d) => d.ok !== null);

    const total = data.length;
    const failures = data.filter((d) => d.ok === false).length;
    const failureRate = total ? failures / total : Number.NaN;

    const timeouts = data.filter((d) => d.timeout).length;
    const timeoutRate = total ? timeouts / total : Number.NaN;

    const msValues = data.map((d) => d.ms).filter((ms) => Number.isFinite(ms));
    const avg = msValues.length
      ? msValues.reduce((a, b) => a + b, 0) / msValues.length
      : Number.NaN;

    return {
      total,
      failures,
      failureRate,
      timeouts,
      timeoutRate,
      avgMs: avg,
      p95Ms: percentile(msValues, 0.95),
    };
  }, [effectiveView, history]);

  if (history.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3 gap-4 flex-wrap">
        <div>
          <h3 className="text-sm font-medium text-zinc-400">Recent Checks</h3>
          <div className="mt-0.5 text-xs text-zinc-500">
            Last {history.length}
            {typeof maxEntries === "number" ? ` / ${maxEntries}` : ""} checks
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="rounded-full border border-zinc-800 bg-zinc-950/40 px-2 py-1 text-zinc-400">
              Failure rate: <span className="text-zinc-200">{fmtPct(stats.failureRate)}</span>
              {Number.isFinite(stats.failureRate) ? ` (${stats.failures}/${stats.total})` : ""}
            </span>
            <span className="rounded-full border border-zinc-800 bg-zinc-950/40 px-2 py-1 text-zinc-400">
              Avg: <span className="text-zinc-200">{fmtMs(stats.avgMs)}</span>
            </span>
            <span className="rounded-full border border-zinc-800 bg-zinc-950/40 px-2 py-1 text-zinc-400">
              P95: <span className="text-zinc-200">{fmtMs(stats.p95Ms)}</span>
            </span>
            <span className="rounded-full border border-zinc-800 bg-zinc-950/40 px-2 py-1 text-zinc-400">
              Timeouts: <span className="text-zinc-200">{fmtPct(stats.timeoutRate)}</span>
              {Number.isFinite(stats.timeoutRate) ? ` (${stats.timeouts}/${stats.total})` : ""}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">View</span>
          <select
            value={
              effectiveView.kind === "overall"
                ? "__overall__"
                : effectiveView.endpointName
            }
            onChange={(e) => {
              const v = e.target.value;
              if (v === "__overall__") setView({ kind: "overall" });
              else setView({ kind: "endpoint", endpointName: v });
            }}
            className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-2 py-1 text-xs text-zinc-200"
          >
            <option value="__overall__">Overall</option>
            {endpointNames.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-1 items-end h-8">
        {history.map((entry, i) => {
          const datum:
            | {
                ok: boolean | null;
                ms: number;
                label: string;
                status?: number;
                error?: string;
                timeout?: boolean;
              }
            | undefined =
            effectiveView.kind === "overall"
              ? {
                  ok: entry.ok,
                  ms: entry.totalMs,
                  label: "Overall",
                  timeout: (entry.results || []).some((rr) => rr.error === "timeout"),
                }
              : (() => {
                  const r = getEndpointResult(entry, effectiveView.endpointName);
                  if (!r) {
                    return {
                      ok: null as boolean | null,
                      ms: Number.NaN,
                      label: effectiveView.endpointName,
                    };
                  }
                  return {
                    ok: r.ok,
                    ms: r.ms,
                    label: r.name,
                    ...(typeof r.status === "number" ? { status: r.status } : {}),
                    ...(r.error ? { error: r.error } : {}),
                    timeout: r.error === "timeout",
                  };
                })();

          const ms = Number.isFinite(datum.ms) ? datum.ms : 0;
          const height = Math.max(20, Math.min(100, (1 - ms / 3000) * 100));

          const base =
            datum.ok === null
              ? "bg-zinc-700/50 hover:bg-zinc-600/60"
              : datum.ok
                ? "bg-emerald-500/80 hover:bg-emerald-400"
                : datum.timeout
                  ? "bg-amber-500/80 hover:bg-amber-400"
                  : "bg-red-500/80 hover:bg-red-400";

          const title =
            datum.ok === null
              ? `${fmtTime(entry.timestamp)} — no data for ${datum.label}`
              : `${fmtTime(entry.timestamp)} — ${datum.label}: ${datum.ok ? "OK" : datum.timeout ? "Timeout" : "Failed"} · ${datum.ms}ms${
                  !datum.ok && (datum.error || typeof datum.status === "number")
                    ? ` · ${datum.error || datum.status}`
                    : ""
                }`;

          return (
            <div
              key={entry.timestamp + i}
              className="group relative flex-1 max-w-3"
              title={title}
            >
              <div
                className={`w-full rounded-sm transition-all ${base}`}
                style={{ height: `${height}%` }}
              />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-xs whitespace-nowrap shadow-xl">
                  <div
                    className={
                      datum.ok === null
                        ? "text-zinc-300"
                        : datum.ok
                          ? "text-emerald-400"
                          : datum.timeout
                            ? "text-amber-400"
                            : "text-red-400"
                    }
                  >
                    {datum.ok === null
                      ? "No data"
                      : datum.ok
                        ? "OK"
                        : datum.timeout
                          ? "Timeout"
                          : "Failed"}
                  </div>
                  <div className="text-zinc-400">
                    {datum.ok === null ? "—" : `${datum.ms}ms`}
                  </div>
                  {!datum.ok && (datum.error || typeof datum.status === "number") ? (
                    <div className="text-zinc-500 text-[10px]">
                      {datum.error || datum.status}
                    </div>
                  ) : null}
                  <div className="text-zinc-500 text-[10px]">
                    {fmtTime(entry.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {effectiveView.kind === "endpoint" && (
        <p className="mt-2 text-[11px] text-zinc-600">
          Endpoint view uses your browser&apos;s stored probe details. Older entries may show “No
          data” if they were recorded before endpoint-level tracking existed.
        </p>
      )}
    </div>
  );
}
