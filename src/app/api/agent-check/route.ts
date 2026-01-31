import { NextResponse } from "next/server";
import { getCachedProbe, type CheckResult, type ProbeResponse } from "@/lib/probe";
import { APP_NAME, APP_VERSION } from "@/lib/version";

export const runtime = "nodejs";
export const revalidate = 300;

export type AgentCheckResponse = {
  ok: boolean;
  checkedAt: string;
  /**
   * Optional scope when the caller requests a subset of probes.
   * Example: /api/agent-check?category=api or /api/agent-check?name=Posts%20Feed
   */
  scope?: {
    category?: string;
    name?: string;
  };
  action: "OK" | "BACKOFF";
  recommendedBackoffMinutes: number;
  failures: Array<
    Pick<CheckResult, "name" | "category" | "status" | "error" | "ms" | "url">
  >;
  degraded: Array<
    Pick<CheckResult, "name" | "category" | "status" | "error" | "ms" | "url">
  >;
};

function toAgentResponse(
  data: ProbeResponse,
  opts?: { category?: string; name?: string }
): AgentCheckResponse {
  const filtered = (data.results || []).filter((r) => {
    if (opts?.category && r.category !== opts.category) return false;
    if (opts?.name && r.name !== opts.name) return false;
    return true;
  });

  const failures = filtered.filter((r) => !r.ok);

  // "Degraded" heuristic: slow but successful endpoints (p95 would be better; keep it simple)
  const degraded = filtered.filter((r) => r.ok && r.ms >= 2500);

  const ok = failures.length === 0;
  const recommendedBackoffMinutes = ok ? 0 : 20;

  const scope = opts?.category || opts?.name ? { ...opts } : undefined;

  return {
    ok,
    checkedAt: data.checkedAt,
    ...(scope ? { scope } : {}),
    action: ok ? "OK" : "BACKOFF",
    recommendedBackoffMinutes,
    failures: failures.map((r) => ({
      name: r.name,
      category: r.category,
      status: r.status,
      error: r.error,
      ms: r.ms,
      url: r.url,
    })),
    degraded: degraded.map((r) => ({
      name: r.name,
      category: r.category,
      status: r.status,
      error: r.error,
      ms: r.ms,
      url: r.url,
    })),
  };
}

const validCategories = new Set(["site", "api", "docs", "auth"]);

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

  const resp = toAgentResponse(data, { category, name });

  // If the caller asked for a scope that doesn't exist, fail loudly so agents
  // don't accidentally treat "empty list" as healthy.
  if ((category || name) && resp.failures.length === 0 && resp.degraded.length === 0) {
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

  return NextResponse.json(resp, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
    },
  });
}
