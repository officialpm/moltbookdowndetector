"use client";

import { useMemo } from "react";
import type { HistoryEntry } from "./StatusHistory";

type Incident = {
  start: string; // oldest timestamp in incident
  end: string; // newest timestamp in incident
  checks: number;
  degradedChecks: number;
  impactedEndpoints: Array<{ name: string; fail: number; total: number }>; // sorted desc by fail
};

function fmt(ts: string) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

function msBetween(a: string, b: string) {
  const ta = new Date(a).getTime();
  const tb = new Date(b).getTime();
  if (!Number.isFinite(ta) || !Number.isFinite(tb)) return null;
  return Math.abs(tb - ta);
}

function fmtDuration(ms: number | null) {
  if (ms === null) return "—";
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  const ss = s % 60;
  if (h > 0) return `${h}h ${mm}m`;
  if (m > 0) return `${m}m ${ss}s`;
  return `${ss}s`;
}

function computeIncidents(historyNewestFirst: HistoryEntry[]): Incident[] {
  // We want chronological processing for incident grouping.
  const history = [...historyNewestFirst].reverse();

  const incidents: Incident[] = [];
  let current: {
    start: string;
    end: string;
    checks: number;
    degradedChecks: number;
    endpointFails: Map<string, { fail: number; total: number }>;
  } | null = null;

  function closeCurrent() {
    if (!current) return;
    const impactedEndpoints = [...current.endpointFails.entries()]
      .map(([name, v]) => ({ name, fail: v.fail, total: v.total }))
      .filter((x) => x.fail > 0)
      .sort((a, b) => b.fail - a.fail || b.total - a.total || a.name.localeCompare(b.name));

    incidents.push({
      start: current.start,
      end: current.end,
      checks: current.checks,
      degradedChecks: current.degradedChecks,
      impactedEndpoints,
    });
    current = null;
  }

  for (const entry of history) {
    const isDegraded = !entry.ok;

    if (isDegraded && !current) {
      current = {
        start: entry.timestamp,
        end: entry.timestamp,
        checks: 0,
        degradedChecks: 0,
        endpointFails: new Map(),
      };
    }

    if (current) {
      // We treat the incident window as the contiguous segment of checks where overall was degraded.
      if (isDegraded) {
        current.end = entry.timestamp;
        current.checks += 1;
        current.degradedChecks += 1;

        for (const r of entry.results || []) {
          const prev = current.endpointFails.get(r.name) || { fail: 0, total: 0 };
          current.endpointFails.set(r.name, {
            total: prev.total + 1,
            fail: prev.fail + (r.ok ? 0 : 1),
          });
        }
        continue;
      }

      // We hit an OK check after a degraded streak: incident ends.
      closeCurrent();
    }
  }

  closeCurrent();

  // Return newest incidents first (more natural for UI)
  return incidents.reverse();
}

export default function IncidentSummary({ history }: { history: HistoryEntry[] }) {
  const incidents = useMemo(() => computeIncidents(history), [history]);

  if (!history.length) return null;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-sm font-medium text-zinc-300">Recent Incidents</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Derived from your browser&apos;s recent probe history (not a global incident log).
          </p>
        </div>
        <div className="text-[11px] text-zinc-600">
          Tip: export diagnostics to share this timeline.
        </div>
      </div>

      {incidents.length === 0 ? (
        <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/30 px-4 py-3 text-xs text-emerald-400">
          No degraded periods detected in your current history window.
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {incidents.slice(0, 6).map((inc, idx) => {
            const duration = fmtDuration(msBetween(inc.start, inc.end));
            const impacted = inc.impactedEndpoints.slice(0, 4);

            return (
              <div
                key={inc.start + inc.end + idx}
                className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-4"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="text-xs font-semibold text-red-300">
                      Degraded · {duration}
                      <span className="text-zinc-600"> · {inc.degradedChecks} checks</span>
                    </div>
                    <div className="mt-1 text-[11px] text-zinc-500">
                      {fmt(inc.start)} → {fmt(inc.end)}
                    </div>
                  </div>

                  {impacted.length ? (
                    <div className="text-right">
                      <div className="text-[10px] text-zinc-600">Most impacted</div>
                      <div className="mt-1 flex flex-wrap gap-1 justify-end">
                        {impacted.map((e) => (
                          <span
                            key={e.name}
                            className="inline-flex items-center rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] text-red-300"
                            title={`${e.name}: ${e.fail}/${e.total} failed during incident`}
                          >
                            {e.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-zinc-600">No endpoint details</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-3 text-[11px] text-zinc-600">
        Note: an &quot;incident&quot; here is a streak of overall degraded checks; brief endpoint-only flakiness may not appear unless it flips the overall status.
      </div>
    </div>
  );
}
