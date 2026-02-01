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

  /** Optional scope when the caller requests a subset of probes. */
  scope?: { category?: string; name?: string };

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

const validCategories = new Set(["site", "api", "docs", "auth"]);

function summarize(
  data: ProbeResponse,
  opts?: { category?: string; name?: string }
): Omit<StatusResponse, "probeRegion"> {
  const filtered = (data.results || []).filter((r) => {
    if (opts?.category && r.category !== opts.category) return false;
    if (opts?.name && r.name !== opts.name) return false;
    return true;
  });

  const byCategory: StatusResponse["byCategory"] = {};

  for (const r of filtered) {
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

  const totalProbes = filtered.length;
  const totalFailures = filtered.filter((r) => !r.ok).length;
  const totalTimeouts = filtered.filter((r) => !r.ok && r.error === "timeout").length;

  const ok = totalFailures === 0;

  const scope = opts?.category || opts?.name ? { ...opts } : undefined;

  return {
    ok,
    status: ok ? "operational" : "degraded",
    checkedAt: data.checkedAt,

    ...(scope
      ? {
          scope: {
            ...(opts?.category ? { category: opts.category } : {}),
            ...(opts?.name ? { name: opts.name } : {}),
          },
        }
      : {}),

    authEnabled: data.authEnabled,
    authProbesIncluded: data.authProbesIncluded,

    totalMs: data.totalMs,
    totals: { totalProbes, totalFailures, totalTimeouts },
    byCategory,

    results: filtered,
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const category = url.searchParams.get("category") || undefined;
  const name = url.searchParams.get("name") || undefined;

  if (category && !validCategories.has(category)) {
    return NextResponse.json(
      {
        error: "invalid category",
        allowed: Array.from(validCategories.values()).sort(),
      },
      { status: 400 }
    );
  }

  const data = await getCachedProbe(
    `${APP_NAME}/${APP_VERSION} (+https://github.com/officialpm/moltbookdowndetector)`
  );

  // If the caller asked for a scope that doesn't exist, fail loudly.
  if (category || name) {
    const anyMatching = (data.results || []).some((r) => {
      if (category && r.category !== category) return false;
      if (name && r.name !== name) return false;
      return true;
    });

    if (!anyMatching) {
      return NextResponse.json(
        {
          error: "no matching probes for requested scope",
          scope: { ...(category ? { category } : {}), ...(name ? { name } : {}) },
        },
        { status: 404 }
      );
    }
  }

  const probeRegion = getProbeRegion(request);

  const resp: StatusResponse = {
    ...summarize(data, { category, name }),
    ...(probeRegion ? { probeRegion } : {}),
  };

  return NextResponse.json(resp, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
    },
  });
}
