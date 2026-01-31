"use client";

import { useMemo } from "react";
import type { HistoryEntry } from "./StatusHistory";

type EndpointAgg = {
  name: string;
  n: number;
  fail: number;
  avgMs: number;
  failPct: number;
};

function computeAgg(history: HistoryEntry[]): EndpointAgg[] {
  const m = new Map<string, { n: number; fail: number; msSum: number }>();

  for (const entry of history) {
    for (const r of entry.results || []) {
      const prev = m.get(r.name) || { n: 0, fail: 0, msSum: 0 };
      m.set(r.name, {
        n: prev.n + 1,
        fail: prev.fail + (r.ok ? 0 : 1),
        msSum: prev.msSum + (Number.isFinite(r.ms) ? r.ms : 0),
      });
    }
  }

  const out: EndpointAgg[] = [];
  for (const [name, v] of m.entries()) {
    const avgMs = v.n ? Math.round(v.msSum / v.n) : 0;
    const failPct = v.n ? Math.round((v.fail / v.n) * 100) : 0;
    out.push({ name, n: v.n, fail: v.fail, avgMs, failPct });
  }

  return out;
}

export default function ReliabilitySummary({
  history,
  minSamples = 6,
}: {
  history: HistoryEntry[];
  /** Hide endpoints that don't have enough samples yet (avoid noisy early stats). */
  minSamples?: number;
}) {
  const stats = useMemo(() => {
    const agg = computeAgg(history).filter((x) => x.n >= minSamples);
    const totalSamples = agg.reduce((sum, x) => sum + x.n, 0);
    const totalFails = agg.reduce((sum, x) => sum + x.fail, 0);
    const overallFailPct = totalSamples ? Math.round((totalFails / totalSamples) * 100) : 0;

    const flakiest = [...agg]
      .sort((a, b) => b.failPct - a.failPct || b.n - a.n)
      .slice(0, 4);

    const slowest = [...agg]
      .sort((a, b) => b.avgMs - a.avgMs || b.n - a.n)
      .slice(0, 4);

    return {
      hasData: agg.length > 0,
      totalSamples,
      totalFails,
      overallFailPct,
      flakiest,
      slowest,
    };
  }, [history, minSamples]);

  if (!stats.hasData) return null;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">Reliability summary</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Computed from the last {Math.min(history.length, 120)} local checks (browser history).
            Stats start after {minSamples}+ samples/endpoint.
          </p>
        </div>

        <div className="text-right">
          <div className="text-xs text-zinc-500">Overall failure rate</div>
          <div
            className={
              "mt-1 inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold " +
              (stats.overallFailPct === 0
                ? "bg-emerald-500/10 text-emerald-400"
                : stats.overallFailPct <= 5
                  ? "bg-amber-500/10 text-amber-400"
                  : "bg-red-500/10 text-red-400")
            }
          >
            {stats.overallFailPct}%
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <div className="text-xs font-medium text-zinc-400">Most flaky endpoints</div>
          <ul className="mt-3 space-y-2">
            {stats.flakiest.map((x) => (
              <li key={x.name} className="flex items-center justify-between gap-4">
                <span className="text-sm text-zinc-200 truncate">{x.name}</span>
                <span className="shrink-0 text-xs text-zinc-500">
                  {x.failPct}% fail · n={x.n}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <div className="text-xs font-medium text-zinc-400">Slowest endpoints (avg)</div>
          <ul className="mt-3 space-y-2">
            {stats.slowest.map((x) => (
              <li key={x.name} className="flex items-center justify-between gap-4">
                <span className="text-sm text-zinc-200 truncate">{x.name}</span>
                <span className="shrink-0 text-xs text-zinc-500">
                  {x.avgMs}ms avg · n={x.n}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-4 text-[11px] text-zinc-600">
        Note: This is a client-side view. It reflects checks from <em>your</em> browser, not a global
        uptime SLO.
      </p>
    </div>
  );
}
