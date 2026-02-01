"use client";

import { useMemo, useState } from "react";
import type { HistoryEntry } from "./StatusHistory";

type Category = "site" | "api" | "docs" | "auth";

type CheckResult = {
  name: string;
  url: string;
  category: Category;
  ok: boolean;
  ms: number;
};

type EndpointAgg = {
  name: string;
  category?: Category;
  path?: string;
  n: number;
  ok: number;
  fail: number;
  p95Ms: number;
  avgMs: number;
  lastSeenAt?: string;
  lastFailAt?: string;
  lastOkAt?: string;
};

function percentile(values: number[], p: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
  return sorted[idx] ?? 0;
}

function fmtTime(ts?: string) {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleTimeString();
  } catch {
    return ts;
  }
}

export default function EndpointStatsTable({
  history,
  latestResults,
  maxEndpoints = 50,
}: {
  history: HistoryEntry[];
  latestResults: CheckResult[];
  maxEndpoints?: number;
}) {
  const [sort, setSort] = useState<"failRate" | "p95" | "name">("failRate");
  const [category, setCategory] = useState<Category | "all">("all");
  const [q, setQ] = useState("");
  const [onlyIssues, setOnlyIssues] = useState(false);

  const latestByName = useMemo(() => {
    const m = new Map<string, CheckResult>();
    for (const r of latestResults || []) m.set(r.name, r);
    return m;
  }, [latestResults]);

  const rows = useMemo(() => {
    const msMap = new Map<string, number[]>();
    const agg = new Map<string, EndpointAgg>();

    // History is newest-first; we want lastSeen/lastOk/lastFail to reflect newest timestamps.
    for (const entry of history) {
      for (const r of entry.results || []) {
        const prev = agg.get(r.name) || {
          name: r.name,
          n: 0,
          ok: 0,
          fail: 0,
          p95Ms: 0,
          avgMs: 0,
        };

        const ms = Number.isFinite(r.ms) ? r.ms : 0;
        const msArr = msMap.get(r.name) || [];
        msArr.push(ms);
        msMap.set(r.name, msArr);

        const next: EndpointAgg = {
          ...prev,
          n: prev.n + 1,
          ok: prev.ok + (r.ok ? 1 : 0),
          fail: prev.fail + (r.ok ? 0 : 1),
          lastSeenAt: prev.lastSeenAt ?? entry.timestamp,
          lastOkAt: r.ok ? prev.lastOkAt ?? entry.timestamp : prev.lastOkAt,
          lastFailAt: !r.ok ? prev.lastFailAt ?? entry.timestamp : prev.lastFailAt,
        };
        agg.set(r.name, next);
      }
    }

    const out: EndpointAgg[] = [];
    for (const [name, a] of agg.entries()) {
      const msArr = msMap.get(name) || [];
      const avgMs = msArr.length
        ? Math.round(msArr.reduce((sum, v) => sum + v, 0) / msArr.length)
        : 0;
      const p95Ms = Math.round(percentile(msArr, 0.95));

      const latest = latestByName.get(name);
      out.push({
        ...a,
        category: latest?.category,
        path: latest ? new URL(latest.url).pathname : undefined,
        avgMs,
        p95Ms,
      });
    }

    const failRate = (x: EndpointAgg) => (x.n ? x.fail / x.n : 0);

    const query = q.trim().toLowerCase();
    const filtered = out.filter((x) => {
      if (category !== "all" && x.category && x.category !== category) return false;
      if (category !== "all" && !x.category) return false;

      if (query) {
        const hay = `${x.name} ${x.path || ""}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }

      if (onlyIssues) {
        const latest = latestByName.get(x.name);
        const hasIssue = x.fail > 0 || latest?.ok === false;
        if (!hasIssue) return false;
      }

      return true;
    });

    filtered.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "p95") return b.p95Ms - a.p95Ms;
      // failRate
      const fr = failRate(b) - failRate(a);
      if (fr !== 0) return fr;
      return b.p95Ms - a.p95Ms;
    });

    return filtered.slice(0, maxEndpoints);
  }, [history, latestByName, maxEndpoints, sort, category, q, onlyIssues]);

  if (!history.length) return null;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-sm font-medium text-zinc-300">Endpoint stats (local)</h3>
          <p className="mt-0.5 text-xs text-zinc-500">
            Based on your last {history.length} browser-stored checks.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <label className="flex items-center gap-2 text-xs text-zinc-500">
            <input
              type="checkbox"
              checked={onlyIssues}
              onChange={(e) => setOnlyIssues(e.target.checked)}
              className="h-3 w-3 accent-amber-500"
            />
            Only issues
          </label>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as typeof category)}
            className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-2 py-1 text-xs text-zinc-200"
            aria-label="Filter category"
          >
            <option value="all">All categories</option>
            <option value="site">site</option>
            <option value="api">api</option>
            <option value="docs">docs</option>
            <option value="auth">auth</option>
          </select>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search endpoints…"
            className="w-44 rounded-lg border border-zinc-800 bg-zinc-950/40 px-2 py-1 text-xs text-zinc-200 placeholder:text-zinc-600"
          />

          <span className="text-xs text-zinc-500">Sort</span>
          <select
            value={sort}
            onChange={(e) => {
              const v = e.target.value as typeof sort;
              setSort(v);
            }}
            className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-2 py-1 text-xs text-zinc-200"
          >
            <option value="failRate">Failure rate</option>
            <option value="p95">p95 latency</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="text-zinc-500">
              <th className="text-left font-medium py-2 pr-4">Endpoint</th>
              <th className="text-left font-medium py-2 pr-4">Category</th>
              <th className="text-right font-medium py-2 pr-4">Fail%</th>
              <th className="text-right font-medium py-2 pr-4">p95</th>
              <th className="text-right font-medium py-2 pr-4">avg</th>
              <th className="text-right font-medium py-2 pr-4">n</th>
              <th className="text-right font-medium py-2 pr-4">Last OK</th>
              <th className="text-right font-medium py-2">Last fail</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const failPct = r.n ? Math.round((r.fail / r.n) * 100) : 0;
              const warn = failPct >= 10;
              const bad = failPct >= 30;

              return (
                <tr key={r.name} className="border-t border-zinc-800/60">
                  <td className="py-2 pr-4">
                    <div className="text-zinc-200 font-medium">{r.name}</div>
                    <div className="text-[11px] text-zinc-600 truncate max-w-[520px]">
                      {r.path || "—"}
                    </div>
                  </td>
                  <td className="py-2 pr-4 text-zinc-400">{r.category || "—"}</td>
                  <td
                    className={`py-2 pr-4 text-right font-medium ${
                      bad ? "text-red-400" : warn ? "text-amber-400" : "text-zinc-300"
                    }`}
                  >
                    {failPct}%
                  </td>
                  <td className="py-2 pr-4 text-right text-zinc-300">{r.p95Ms}ms</td>
                  <td className="py-2 pr-4 text-right text-zinc-400">{r.avgMs}ms</td>
                  <td className="py-2 pr-4 text-right text-zinc-500">{r.n}</td>
                  <td className="py-2 pr-4 text-right text-zinc-500">{fmtTime(r.lastOkAt)}</td>
                  <td className="py-2 text-right text-zinc-500">{fmtTime(r.lastFailAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-[11px] text-zinc-600">
        Note: this is per-browser history, not a global backend SLO.
      </p>
    </div>
  );
}
