import { NextResponse } from "next/server";
import { getCachedProbe, type ProbeResponse } from "@/lib/probe";
import { getProbeRegion } from "@/lib/runtime";
import { APP_NAME, APP_VERSION } from "@/lib/version";

export const runtime = "nodejs";
export const revalidate = 300;

export type StatusResponse = {
  ok: boolean;
  status: "operational" | "degraded";
  checkedAt: string;
  /** Best-effort runtime region for the probe (helps debug region-specific issues). */
  probeRegion?: string;

  authEnabled: boolean;
  authProbesIncluded: number;

  totalMs: number;
  totals: {
    totalProbes: number;
    totalFailures: number;
    totalTimeouts: number;
  };
  byCategory: Record<
    string,
    {
      ok: boolean;
      total: number;
      failures: number;
      timeouts: number;
    }
  >;

  /** Full probe results for dashboards that want per-endpoint detail. */
  results: ProbeResponse["results"];
};

function summarize(data: ProbeResponse): Omit<StatusResponse, "probeRegion"> {
  const byCategory: StatusResponse["byCategory"] = {};

  for (const r of data.results || []) {
    const key = r.category || "unknown";
    const prev = byCategory[key] || { ok: true, total: 0, failures: 0, timeouts: 0 };
    const isFailure = !r.ok;
    const isTimeout = isFailure && r.error === "timeout";
    byCategory[key] = {
      ok: prev.ok && !isFailure,
      total: prev.total + 1,
      failures: prev.failures + (isFailure ? 1 : 0),
      timeouts: prev.timeouts + (isTimeout ? 1 : 0),
    };
  }

  const totalProbes = (data.results || []).length;
  const totalFailures = (data.results || []).filter((r) => !r.ok).length;
  const totalTimeouts = (data.results || []).filter((r) => !r.ok && r.error === "timeout").length;

  return {
    ok: data.ok,
    status: data.ok ? "operational" : "degraded",
    checkedAt: data.checkedAt,

    authEnabled: data.authEnabled,
    authProbesIncluded: data.authProbesIncluded,

    totalMs: data.totalMs,
    totals: { totalProbes, totalFailures, totalTimeouts },
    byCategory,

    results: data.results || [],
  };
}

export async function GET(request: Request) {
  const data = await getCachedProbe(
    `${APP_NAME}/${APP_VERSION} (+https://github.com/officialpm/moltbookdowndetector)`
  );

  const probeRegion = getProbeRegion(request);

  const resp: StatusResponse = {
    ...summarize(data),
    ...(probeRegion ? { probeRegion } : {}),
  };

  return NextResponse.json(resp, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
    },
  });
}
