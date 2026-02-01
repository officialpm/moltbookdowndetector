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

type CategoryAgg = {
  category: string;
  n: number;
  fail: number;
  timeouts: number;
  avgMs: number;
  failPct: number;
  timeoutPct: number;
};

const categoryLabel: Record<string, string> = {
  site: "🌐 Core Site",
  api: "📡 Public API",
  docs: "📚 Agent Docs",
  auth: "🔐 Authenticated",
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

function computeCategoryAgg(history: HistoryEntry[]): CategoryAgg[] {
  const m = new Map<
    string,
    { n: number; fail: number; timeouts: number; msSum: number }
  >();

  for (const entry of history) {
    for (const r of entry.results || []) {
      if (!r.category) continue;
      const prev = m.get(r.category) || { n: 0, fail: 0, timeouts: 0, msSum: 0 };
      const isFail = !r.ok;
      const isTimeout = isFail && r.error === "timeout";
      m.set(r.category, {
        n: prev.n + 1,
        fail: prev.fail + (isFail ? 1 : 0),
        timeouts: prev.timeouts + (isTimeout ? 1 : 0),
        msSum: prev.msSum + (Number.isFinite(r.ms) ? r.ms : 0),
      });
    }
  }

  const out: CategoryAgg[] = [];
  for (const [category, v] of m.entries()) {
    const avgMs = v.n ? Math.round(v.msSum / v.n) : 0;
    const failPct = v.n ? Math.round((v.fail / v.n) * 100) : 0;
    const timeoutPct = v.n ? Math.round((v.timeouts / v.n) * 100) : 0;
    out.push({
      category,
      n: v.n,
      fail: v.fail,
      timeouts: v.timeouts,
      avgMs,
      failPct,
      timeoutPct,
    });
  }

  return out.sort((a, b) => a.category.localeCompare(b.category));
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

    const categories = computeCategoryAgg(history);

    return {
      hasData: agg.length > 0,
      totalSamples,
      totalFails,
      overallFailPct,
      flakiest,
      slowest,
      categories,
      hasCategoryData: categories.length > 0,
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

      {stats.hasCategoryData ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.categories.map((c) => {
            const label = categoryLabel[c.category] || c.category;
            const severity =
              c.failPct === 0
                ? "ok"
                : c.failPct <= 5
                  ? "warn"
                  : "bad";

            const badgeClass =
              severity === "ok"
                ? "bg-emerald-500/10 text-emerald-400"
                : severity === "warn"
                  ? "bg-amber-500/10 text-amber-400"
                  : "bg-red-500/10 text-red-400";

            return (
              <div
                key={c.category}
                className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4"
              >
                <div className="text-xs font-medium text-zinc-400">{label}</div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className={`rounded-full px-2 py-1 text-sm font-semibold ${badgeClass}`}>
                    {c.failPct}% fail
                  </div>
                  <div className="text-[11px] text-zinc-500">n={c.n}</div>
                </div>
                <div className="mt-2 text-[11px] text-zinc-500">
                  Avg <span className="text-zinc-300">{c.avgMs}ms</span> · Timeouts{" "}
                  <span className="text-zinc-300">{c.timeoutPct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

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
