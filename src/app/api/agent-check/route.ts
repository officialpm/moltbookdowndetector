import { NextResponse } from "next/server";
import { getCachedProbe, type CheckResult, type ProbeResponse } from "@/lib/probe";
import { APP_NAME, APP_VERSION } from "@/lib/version";

export const runtime = "nodejs";
export const revalidate = 300;

export type AgentCheckResponse = {
  ok: boolean;
  checkedAt: string;
  action: "OK" | "BACKOFF";
  recommendedBackoffMinutes: number;
  failures: Array<Pick<CheckResult, "name" | "category" | "status" | "error" | "ms" | "url">>;
  degraded: Array<Pick<CheckResult, "name" | "category" | "status" | "error" | "ms" | "url">>;
};

function toAgentResponse(data: ProbeResponse): AgentCheckResponse {
  const failures = (data.results || []).filter((r) => !r.ok);

  // "Degraded" heuristic: slow but successful endpoints (p95 would be better; keep it simple)
  const degraded = (data.results || []).filter((r) => r.ok && r.ms >= 2500);

  const ok = failures.length === 0;
  const recommendedBackoffMinutes = ok ? 0 : 20;

  return {
    ok,
    checkedAt: data.checkedAt,
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

export async function GET() {
  const data = await getCachedProbe(
    `${APP_NAME}/${APP_VERSION} (+https://github.com/officialpm/moltbookdowndetector)`
  );

  return NextResponse.json(toAgentResponse(data), {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
    },
  });
}
