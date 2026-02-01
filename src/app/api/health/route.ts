import { NextResponse } from "next/server";
import { getCachedProbe, type ProbeResponse } from "@/lib/probe";
import { getProbeRegion } from "@/lib/runtime";
import { APP_NAME, APP_VERSION } from "@/lib/version";

export const runtime = "nodejs";
export const revalidate = 300;

type HealthResponse = {
  ok: boolean;
  checkedAt: string;
  /** Best-effort runtime region for the probe (helps debug region-specific issues). */
  probeRegion?: string;
  scope?: { category?: string; name?: string };
  /** OK when healthy; BACKOFF when any scoped probe fails. */
  action: "OK" | "BACKOFF";
  /** Suggested write-backoff window when unhealthy. */
  recommendedBackoffMinutes: number;
  /** Count of failing probes in the selected scope. */
  failures: number;
};

const validCategories = new Set(["site", "api", "docs", "auth"]);

function toHealthResponse(
  data: ProbeResponse,
  opts?: { category?: string; name?: string; probeRegion?: string }
): HealthResponse {
  const filtered = (data.results || []).filter((r) => {
    if (opts?.category && r.category !== opts.category) return false;
    if (opts?.name && r.name !== opts.name) return false;
    return true;
  });

  const failures = filtered.filter((r) => !r.ok);
  const ok = failures.length === 0;

  const scope = opts?.category || opts?.name ? { ...opts } : undefined;

  return {
    ok,
    checkedAt: data.checkedAt,
    ...(opts?.probeRegion ? { probeRegion: opts.probeRegion } : {}),
    ...(scope ? { scope: { ...(opts?.category ? { category: opts.category } : {}), ...(opts?.name ? { name: opts.name } : {}) } } : {}),
    action: ok ? "OK" : "BACKOFF",
    recommendedBackoffMinutes: ok ? 0 : 20,
    failures: failures.length,
  };
}

function toPlainText(resp: HealthResponse): string {
  const scope = resp.scope
    ? ` (scope: ${resp.scope.category ? `category=${resp.scope.category}` : ""}${resp.scope.category && resp.scope.name ? ", " : ""}${resp.scope.name ? `name=${resp.scope.name}` : ""})`
    : "";

  if (resp.ok) {
    return `OK${scope} — checkedAt=${resp.checkedAt}`;
  }

  return `BACKOFF${scope} — checkedAt=${resp.checkedAt} — failures=${resp.failures} — backoff=${resp.recommendedBackoffMinutes}m`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const category = url.searchParams.get("category") || undefined;
  const name = url.searchParams.get("name") || undefined;
  const format = (url.searchParams.get("format") || "text").toLowerCase();

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

  const probeRegion = getProbeRegion(request);
  const resp = toHealthResponse(data, { category, name, probeRegion });

  // If the caller asked for a scope that doesn't exist, fail loudly.
  if ((category || name) && resp.failures === 0) {
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

  const status = resp.ok ? 200 : 503;

  if (format === "json") {
    return NextResponse.json(resp, {
      status,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  }

  return new NextResponse(toPlainText(resp), {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
    },
  });
}
