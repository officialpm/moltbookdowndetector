"use client";

import { useEffect, useState } from "react";

type HistoryEntry = {
  timestamp: string;
  ok: boolean;
  totalMs: number;
};

const STORAGE_KEY = "moltbook-status-history";
const MAX_ENTRIES = 24;

export function useStatusHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch {
        // ignore
      }
    }
  }, []);

  const addEntry = (entry: HistoryEntry) => {
    setHistory((prev) => {
      const updated = [entry, ...prev].slice(0, MAX_ENTRIES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  return { history, addEntry };
}

export default function StatusHistory({ history }: { history: HistoryEntry[] }) {
  if (history.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-zinc-400">Recent Checks</h3>
        <span className="text-xs text-zinc-500">Last {history.length} checks</span>
      </div>
      <div className="flex gap-1 items-end h-8">
        {history.map((entry, i) => {
          const height = Math.max(20, Math.min(100, (1 - entry.totalMs / 3000) * 100));
          return (
            <div
              key={entry.timestamp + i}
              className="group relative flex-1 max-w-3"
              title={`${new Date(entry.timestamp).toLocaleTimeString()} - ${entry.totalMs}ms`}
            >
              <div
                className={`w-full rounded-sm transition-all ${
                  entry.ok ? "bg-emerald-500/80 hover:bg-emerald-400" : "bg-red-500/80 hover:bg-red-400"
                }`}
                style={{ height: `${height}%` }}
              />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-xs whitespace-nowrap shadow-xl">
                  <div className={entry.ok ? "text-emerald-400" : "text-red-400"}>
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
