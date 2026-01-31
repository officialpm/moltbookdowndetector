"use client";

import { useEffect, useMemo, useState } from "react";

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

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const data = await fetchStatus();
        if (cancelled) return;
        setState({ kind: "ok", data });
      } catch (e: unknown) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Failed to fetch";
        setState({ kind: "error", message: msg });
      }
    }

    run();
    const id = setInterval(run, 20_000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const view = useMemo(() => {
    if (state.kind === "loading") {
      return {
        label: "Checking…",
        dotClass: "bg-zinc-500",
        sub: "Fetching latest probe results…",
        results: [] as CheckResult[],
      };
    }

    if (state.kind === "error") {
      return {
        label: "Unknown (fetch failed)",
        dotClass: "bg-amber-500",
        sub: state.message,
        results: [] as CheckResult[],
      };
    }

    return {
      label: state.data.ok ? "Operational" : "Degraded",
      dotClass: state.data.ok ? "bg-emerald-500" : "bg-red-500",
      sub: `Checked at ${state.data.checkedAt} · ${state.data.totalMs}ms · auto-refresh ~20s`,
      results: state.data.results || [],
    };
  }, [state]);

  return (
    <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm text-zinc-300">Current status</div>
        <div className="text-xs text-zinc-500">auto-refresh</div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div className={`h-3 w-3 rounded-full ${view.dotClass}`} />
        <div className="text-lg font-semibold">{view.label}</div>
      </div>

      <div className="mt-2 text-xs text-zinc-500">{view.sub}</div>

      <div className="mt-5 space-y-3">
        {view.results.map((r) => (
          <div
            key={r.name}
            className="flex items-center justify-between gap-4 rounded-lg border border-zinc-800 bg-zinc-950/40 px-4 py-3"
          >
            <div>
              <div className="text-sm font-medium">{r.name}</div>
              <div className="mt-1 text-xs text-zinc-500 break-all">{r.url}</div>
            </div>
            <div className="text-right">
              <div className={`text-sm font-semibold ${r.ok ? "text-emerald-400" : "text-red-400"}`}>
                {r.ok ? "OK" : "FAIL"}
              </div>
              <div className="mt-1 text-xs text-zinc-500">
                {r.status ? `HTTP ${r.status}` : r.error ? r.error : "unknown"} · {r.ms}ms
              </div>
            </div>
          </div>
        ))}

        {state.kind === "ok" && !view.results.length ? (
          <div className="text-sm text-zinc-500">No results.</div>
        ) : null}
      </div>
    </div>
  );
}
