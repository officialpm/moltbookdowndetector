"use client";

import StatusHistory, {
  type HistoryEntry,
  type HistoryProbeResult,
  useStatusHistory,
} from "./components/StatusHistory";
import ReliabilitySummary from "./components/ReliabilitySummary";
import { useCallback, useEffect, useMemo, useState } from "react";

import LatencyBar from "./components/LatencyBar";
import RefreshButton from "./components/RefreshButton";
import StatusDot from "./components/StatusDot";

type CheckResult = {
  name: string;
  url: string;
  category: "site" | "api" | "docs" | "auth";
  status: number;
  ok: boolean;
  ms: number;
  error?: string;
};

type CheckResponse = {
  ok: boolean;
  checkedAt: string;
  totalMs: number;
  results: CheckResult[];
};

type LoadState =
  | { kind: "loading" }
  | { kind: "ok"; data: CheckResponse }
  | { kind: "error"; message: string };

async function fetchStatus(): Promise<CheckResponse> {
  const res = await fetch("/api/check", { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as CheckResponse;
}

const categoryConfig = {
  site: {
    label: "🌐 Core Site",
    description: "Main website availability",
  },
  api: {
    label: "📡 Public API",
    description: "Publicly accessible endpoints",
  },
  docs: {
    label: "📚 Agent Docs",
    description: "MCP skill documentation files",
  },
  auth: {
    label: "🔐 Authenticated",
    description: "Requires API key",
  },
};

type EndpointStats = {
  n: number;
  fail: number;
  avgMs: number;
  lastFailAt?: string;
};

function computeEndpointStats(history: HistoryEntry[]): Map<string, EndpointStats> {
  const m = new Map<string, { n: number; fail: number; msSum: number; lastFailAt?: string }>();

  for (const entry of history) {
    for (const r of entry.results || []) {
      const prev = m.get(r.name) || { n: 0, fail: 0, msSum: 0 };
      const next = {
        n: prev.n + 1,
        fail: prev.fail + (r.ok ? 0 : 1),
        msSum: prev.msSum + (Number.isFinite(r.ms) ? r.ms : 0),
        lastFailAt: !r.ok ? entry.timestamp : prev.lastFailAt,
      };
      m.set(r.name, next);
    }
  }

  const out = new Map<string, EndpointStats>();
  for (const [name, v] of m.entries()) {
    out.set(name, {
      n: v.n,
      fail: v.fail,
      avgMs: v.n ? Math.round(v.msSum / v.n) : 0,
      lastFailAt: v.lastFailAt,
    });
  }
  return out;
}

function EndpointCard({
  r,
  stats,
}: {
  r: CheckResult;
  stats?: EndpointStats;
}) {
  const failPct = stats && stats.n ? Math.round((stats.fail / stats.n) * 100) : undefined;

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border transition-all duration-300 hover:scale-[1.01] ${
        r.ok
          ? "border-zinc-800 bg-zinc-900/40 hover:border-emerald-500/30 hover:bg-zinc-900/60"
          : "border-red-500/30 bg-red-950/20 hover:border-red-500/50"
      }`}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <StatusDot
            status={r.ok ? "operational" : "degraded"}
            size="sm"
            pulse={false}
          />
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{r.name}</div>
            <div className="mt-0.5 text-xs text-zinc-500 truncate max-w-[200px]">
              {new URL(r.url).pathname}
            </div>
            {stats && stats.n > 0 && (
              <div className="mt-1 text-[11px] text-zinc-500">
                Recent: {failPct}% fail (n={stats.n}) · avg {stats.avgMs}ms
                {stats.lastFailAt ? (
                  <span className="text-zinc-600">
                    {" "}
                    · last fail {new Date(stats.lastFailAt).toLocaleTimeString()}
                  </span>
                ) : null}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <LatencyBar ms={r.ms} />
          <div className="text-right min-w-[60px]">
            <div
              className={`text-xs font-bold ${
                r.ok ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {r.ok ? "OK" : "FAIL"}
            </div>
            <div className="text-[10px] text-zinc-500">
              {r.status || r.error || "Err"}
            </div>
          </div>
        </div>
      </div>
      <div
        className={`absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none ${
          r.ok
            ? "bg-gradient-to-r from-emerald-500/5 to-transparent"
            : "bg-gradient-to-r from-red-500/5 to-transparent"
        }`}
      />
    </div>
  );
}

function EndpointGrid({
  results,
  history,
}: {
  results: CheckResult[];
  history: HistoryEntry[];
}) {
  const grouped = useMemo(() => {
    const groups: Record<string, CheckResult[]> = {};
    for (const r of results) {
      const cat = r.category || "api";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(r);
    }
    return groups;
  }, [results]);

  const endpointStats = useMemo(() => computeEndpointStats(history), [history]);

  const categoryOrder: Array<"site" | "api" | "docs" | "auth"> = [
    "site",
    "api",
    "docs",
    "auth",
  ];

  if (!results.length) return null;

  return (
    <div className="space-y-6">
      {categoryOrder.map((cat) => {
        const items = grouped[cat];
        if (!items?.length) return null;
        const config = categoryConfig[cat];
        const allOk = items.every((r) => r.ok);

        return (
          <div key={cat} className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                  {config.label}
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      allOk
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {items.filter((r) => r.ok).length}/{items.length}
                  </span>
                </h3>
                <p className="text-xs text-zinc-500">{config.description}</p>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {items.map((r) => (
                <EndpointCard key={r.name} r={r} stats={endpointStats.get(r.name)} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function StatusCard() {
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | undefined>();
  const { history, addEntry, maxEntries } = useStatusHistory();

  const doFetch = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchStatus();
      setState({ kind: "ok", data });
      setLastRefresh(new Date());

      const compactResults: HistoryProbeResult[] = (data.results || []).map((r) => ({
        name: r.name,
        ok: r.ok,
        ms: r.ms,
      }));

      addEntry({
        timestamp: data.checkedAt,
        ok: data.ok,
        totalMs: data.totalMs,
        results: compactResults,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to fetch";
      setState({ kind: "error", message: msg });
    } finally {
      setIsRefreshing(false);
    }
  }, [addEntry]);

  useEffect(() => {
    doFetch();
    const id = setInterval(doFetch, 120_000);
    return () => clearInterval(id);
  }, [doFetch]);

  const view = useMemo(() => {
    if (state.kind === "loading") {
      return {
        label: "Checking…",
        status: "loading" as const,
        sub: "Fetching latest probe results…",
        results: [] as CheckResult[],
      };
    }

    if (state.kind === "error") {
      return {
        label: "Unknown",
        status: "unknown" as const,
        sub: state.message,
        results: [] as CheckResult[],
      };
    }

    const passedCount = state.data.results.filter((r) => r.ok).length;
    const totalCount = state.data.results.length;

    return {
      label: state.data.ok ? "All Systems Operational" : "Service Degraded",
      status: state.data.ok ? ("operational" as const) : ("degraded" as const),
      sub: `${passedCount}/${totalCount} checks passing · ${state.data.totalMs}ms total`,
      results: state.data.results || [],
      checkedAt: state.data.checkedAt,
    };
  }, [state]);

  return (
    <div className="space-y-6">
      {/* Main Status Banner */}
      <div
        className={`relative overflow-hidden rounded-2xl border p-6 transition-all duration-500 ${
          view.status === "operational"
            ? "border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-zinc-900/60 to-zinc-900/40"
            : view.status === "degraded"
              ? "border-red-500/30 bg-gradient-to-br from-red-950/40 via-zinc-900/60 to-zinc-900/40"
              : "border-zinc-800 bg-zinc-900/40"
        }`}
      >
        {/* Glow effect */}
        <div
          className={`absolute -top-24 -right-24 h-48 w-48 rounded-full blur-3xl transition-all duration-500 ${
            view.status === "operational"
              ? "bg-emerald-500/20"
              : view.status === "degraded"
                ? "bg-red-500/20"
                : "bg-zinc-500/10"
          }`}
        />

        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <StatusDot
              status={view.status}
              size="lg"
              pulse={view.status !== "loading"}
            />
            <div>
              <h2 className="text-xl font-bold tracking-tight">{view.label}</h2>
              <p className="mt-1 text-sm text-zinc-400">{view.sub}</p>
            </div>
          </div>
          <RefreshButton
            onClick={doFetch}
            loading={isRefreshing}
            lastRefresh={lastRefresh}
          />
        </div>

        <StatusHistory history={history} maxEntries={maxEntries} />
      </div>

      {/* Reliability Summary (client-side, based on local history) */}
      <ReliabilitySummary history={history} />

      {/* Individual Endpoint Cards */}
      <EndpointGrid results={view.results} history={history} />

      {state.kind === "ok" && !view.results.length && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-8 text-center">
          <div className="text-zinc-500">No endpoints configured</div>
        </div>
      )}

      {state.kind === "loading" && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-4"
            >
              <div className="flex items-center gap-4">
                <div className="h-3 w-3 rounded-full bg-zinc-700" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-32 rounded bg-zinc-700" />
                  <div className="h-3 w-48 rounded bg-zinc-800" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Footer */}
      <div className="flex items-center justify-between text-xs text-zinc-500 pt-2 flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <span>Cached: 5 min</span>
          <span>·</span>
          <span>Auto-refresh: 2 min</span>
        </div>
        {view.status !== "loading" && "checkedAt" in view && view.checkedAt && (
          <span>
            Last check: {new Date(view.checkedAt).toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
}
