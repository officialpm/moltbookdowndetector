"use client";

import { useCallback, useEffect, useState } from "react";

export type HistoryProbeResult = {
  name: string;
  ok: boolean;
  ms: number;
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
      if (!name || rok === null || ms === null) return null;
      return { name, ok: rok, ms };
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

export default function StatusHistory({
  history,
  maxEntries,
}: {
  history: HistoryEntry[];
  maxEntries?: number;
}) {
  if (history.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-zinc-400">Recent Checks</h3>
        <span className="text-xs text-zinc-500">
          Last {history.length}
          {typeof maxEntries === "number" ? ` / ${maxEntries}` : ""} checks
        </span>
      </div>
      <div className="flex gap-1 items-end h-8">
        {history.map((entry, i) => {
          const height = Math.max(
            20,
            Math.min(100, (1 - entry.totalMs / 3000) * 100),
          );
          return (
            <div
              key={entry.timestamp + i}
              className="group relative flex-1 max-w-3"
              title={`${new Date(entry.timestamp).toLocaleTimeString()} - ${entry.totalMs}ms`}
            >
              <div
                className={`w-full rounded-sm transition-all ${
                  entry.ok
                    ? "bg-emerald-500/80 hover:bg-emerald-400"
                    : "bg-red-500/80 hover:bg-red-400"
                }`}
                style={{ height: `${height}%` }}
              />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-xs whitespace-nowrap shadow-xl">
                  <div
                    className={entry.ok ? "text-emerald-400" : "text-red-400"}
                  >
                    {entry.ok ? "OK" : "Failed"}
                  </div>
                  <div className="text-zinc-400">{entry.totalMs}ms</div>
                  <div className="text-zinc-500 text-[10px]">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
