"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import LatencyBar from "./components/LatencyBar";
import RefreshButton from "./components/RefreshButton";
import StatusDot from "./components/StatusDot";
import StatusHistory, { useStatusHistory } from "./components/StatusHistory";

type CheckResult = {
  name: string;
  url: string;
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

export default function StatusCard() {
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | undefined>();
  const { history, addEntry } = useStatusHistory();

  const doFetch = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchStatus();
      setState({ kind: "ok", data });
      setLastRefresh(new Date());
      addEntry({
        timestamp: data.checkedAt,
        ok: data.ok,
        totalMs: data.totalMs,
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

        <StatusHistory history={history} />
      </div>

      {/* Individual Endpoint Cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          Endpoint Status
        </h3>

        {view.results.map((r) => (
          <div
            key={r.name}
            className={`group relative overflow-hidden rounded-xl border transition-all duration-300 hover:scale-[1.01] ${
              r.ok
                ? "border-zinc-800 bg-zinc-900/40 hover:border-emerald-500/30 hover:bg-zinc-900/60"
                : "border-red-500/30 bg-red-950/20 hover:border-red-500/50"
            }`}
          >
            <div className="flex items-center justify-between gap-4 px-5 py-4 flex-wrap">
              <div className="flex items-center gap-4 min-w-0">
                <StatusDot
                  status={r.ok ? "operational" : "degraded"}
                  size="sm"
                  pulse={false}
                />
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{r.name}</div>
                  <div className="mt-1 text-xs text-zinc-500 truncate max-w-md">
                    {r.url}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6 shrink-0 flex-wrap">
                <LatencyBar ms={r.ms} />
                <div className="text-right min-w-[80px]">
                  <div
                    className={`text-sm font-bold ${
                      r.ok ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {r.ok ? "Healthy" : "Unhealthy"}
                  </div>
                  <div className="mt-0.5 text-xs text-zinc-500">
                    {r.status ? `${r.status}` : r.error || "Error"} · {r.ms}ms
                  </div>
                </div>
              </div>
            </div>

            {/* Subtle gradient overlay on hover */}
            <div
              className={`absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none ${
                r.ok
                  ? "bg-gradient-to-r from-emerald-500/5 to-transparent"
                  : "bg-gradient-to-r from-red-500/5 to-transparent"
              }`}
            />
          </div>
        ))}

        {state.kind === "ok" && !view.results.length && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-8 text-center">
            <div className="text-zinc-500">No endpoints configured</div>
          </div>
        )}

        {state.kind === "loading" && (
          <div className="space-y-3">
            {[1, 2].map((i) => (
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
      </div>

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
