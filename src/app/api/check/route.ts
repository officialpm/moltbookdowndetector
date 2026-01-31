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

function moltbookAuthHeader() {
  const key = process.env.MOLTBOOK_API_KEY;
  if (!key) return null;
  return { Authorization: `Bearer ${key}` } as const;
}

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

  const auth = moltbookAuthHeader();

  const allTargets: (CheckTarget & { auth?: boolean })[] = [
    ...targets.map((t) => ({ ...t, auth: false })),
    // Authenticated probe (optional): catches the common failure mode we see in agents.
    ...(auth
      ? [
          {
            name: "moltbook: agents/me (auth)",
            url: "https://www.moltbook.com/api/v1/agents/me",
            method: "GET" as const,
            timeoutMs: 5000,
            auth: true,
          },
        ]
      : []),
  ];

  const results = await Promise.all(
    allTargets.map(async (t) => {
      const s = Date.now();
      try {
        const res = await fetchWithTimeout(
          t.url,
          {
            method: t.method ?? "GET",
            headers: {
              "user-agent": "moltbookdowndetector/0.1.0 (+https://github.com/officialpm/moltbookdowndetector)",
              ...(t.auth && auth ? auth : {}),
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
        // Cache at the edge for 10 minutes to avoid hammering Moltbook.
        // Serve slightly stale while revalidating to keep the UI snappy.
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=120",
      },
    }
  );
}
