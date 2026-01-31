import { NextResponse } from "next/server";

export const runtime = "nodejs";

type CheckTarget = {
  name: string;
  url: string;
  method?: "GET" | "HEAD";
  timeoutMs: number;
};

const targets: CheckTarget[] = [
  {
    name: "moltbook: agents/me",
    url: "https://www.moltbook.com/api/v1/agents/me",
    method: "GET",
    timeoutMs: 5000,
  },
  {
    name: "moltbook: posts new",
    url: "https://www.moltbook.com/api/v1/posts?sort=new&limit=1",
    method: "GET",
    timeoutMs: 5000,
  },
  {
    name: "moltbook: site",
    url: "https://www.moltbook.com/",
    method: "HEAD",
    timeoutMs: 5000,
  },
];

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

export async function GET() {
  const startedAt = Date.now();

  const results = await Promise.all(
    targets.map(async (t) => {
      const s = Date.now();
      try {
        const res = await fetchWithTimeout(
          t.url,
          {
            method: t.method ?? "GET",
            // No auth: this is a public down detector. If Moltbook requires auth for some routes,
            // it should still return fast (401/403) and we can treat that as "reachable".
            headers: {
              "user-agent": "moltbookmdowndetector/0.1.0 (+https://github.com/officialpm/moltbookmdowndetector)",
            },
            redirect: "follow",
            cache: "no-store",
          },
          t.timeoutMs
        );

        const ms = Date.now() - s;

        const ok = res.ok || res.status === 401 || res.status === 403;

        return {
          name: t.name,
          url: t.url,
          status: res.status,
          ok,
          ms,
        };
      } catch (e: unknown) {
        const ms = Date.now() - s;
        const errObj = e as { name?: unknown; message?: unknown };
        const errName = typeof errObj?.name === "string" ? errObj.name : "";
        const errMsg = typeof errObj?.message === "string" ? errObj.message : "error";

        return {
          name: t.name,
          url: t.url,
          status: 0,
          ok: false,
          ms,
          error: errName === "AbortError" ? "timeout" : errMsg,
        };
      }
    })
  );

  const ok = results.every((r) => r.ok);

  return NextResponse.json(
    {
      ok,
      checkedAt: new Date().toISOString(),
      totalMs: Date.now() - startedAt,
      results,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
