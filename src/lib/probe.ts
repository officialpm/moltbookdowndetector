import { unstable_cache } from "next/cache";

export type CheckCategory = "site" | "api" | "docs" | "auth";

export type CheckResult = {
  name: string;
  url: string;
  category: CheckCategory;
  status: number;
  ok: boolean;
  ms: number;
  error?: string;
};

export type CheckTarget = {
  name: string;
  url: string;
  method?: "GET" | "HEAD";
  timeoutMs: number;
  category: CheckCategory;
};

// ============================================
// PUBLIC ENDPOINTS (no auth required)
// ============================================
const publicTargets: CheckTarget[] = [
  // 🌐 Core Site
  {
    name: "Homepage",
    url: "https://www.moltbook.com/",
    method: "HEAD",
    timeoutMs: 5000,
    category: "site",
  },

  // 📡 Public API
  {
    name: "Posts Feed",
    url: "https://www.moltbook.com/api/v1/posts?sort=new&limit=1",
    method: "GET",
    timeoutMs: 5000,
    category: "api",
  },
  {
    name: "Submolts List",
    url: "https://www.moltbook.com/api/v1/submolts",
    method: "GET",
    timeoutMs: 5000,
    category: "api",
  },

  // 📚 Agent Documentation
  {
    name: "skill.md",
    url: "https://www.moltbook.com/skill.md",
    method: "HEAD",
    timeoutMs: 5000,
    category: "docs",
  },
  {
    name: "heartbeat.md",
    url: "https://www.moltbook.com/heartbeat.md",
    method: "HEAD",
    timeoutMs: 5000,
    category: "docs",
  },
  {
    name: "messaging.md",
    url: "https://www.moltbook.com/messaging.md",
    method: "HEAD",
    timeoutMs: 5000,
    category: "docs",
  },
  {
    name: "skill.json",
    url: "https://www.moltbook.com/skill.json",
    method: "HEAD",
    timeoutMs: 5000,
    category: "docs",
  },
];

// ============================================
// AUTHENTICATED ENDPOINTS (requires MOLTBOOK_API_KEY)
// ============================================
const authTargets: CheckTarget[] = [
  // 👤 Agent Identity
  {
    name: "Profile (me)",
    url: "https://www.moltbook.com/api/v1/agents/me",
    method: "GET",
    timeoutMs: 5000,
    category: "auth",
  },
  {
    name: "Claim Status",
    url: "https://www.moltbook.com/api/v1/agents/status",
    method: "GET",
    timeoutMs: 5000,
    category: "auth",
  },

  // 📰 Personalized Content
  {
    name: "Personal Feed",
    url: "https://www.moltbook.com/api/v1/feed?limit=1",
    method: "GET",
    timeoutMs: 5000,
    category: "auth",
  },

  // 🔍 Semantic Search probe removed (per request)

];

function moltbookAuthHeader() {
  const key = process.env.MOLTBOOK_API_KEY;
  if (!key) return null;
  return { Authorization: `Bearer ${key}` } as const;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

export type ProbeResponse = {
  ok: boolean;
  checkedAt: string;
  totalMs: number;
  results: CheckResult[];

  /** Whether authenticated probes were included (requires MOLTBOOK_API_KEY). */
  authEnabled: boolean;
  /** How many authenticated probes were included in this run. */
  authProbesIncluded: number;
};

export async function performProbe(userAgent: string): Promise<ProbeResponse> {
  const startedAt = Date.now();
  const auth = moltbookAuthHeader();
  const authEnabled = Boolean(auth);

  const allTargets: (CheckTarget & { requiresAuth?: boolean })[] = [
    ...publicTargets.map((t) => ({ ...t, requiresAuth: false })),
    ...(auth ? authTargets.map((t) => ({ ...t, requiresAuth: true })) : []),
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
              "user-agent": userAgent,
              ...(t.requiresAuth && auth ? auth : {}),
            },
            redirect: "follow",
            cache: "no-store",
          },
          t.timeoutMs
        );

        const ms = Date.now() - s;

        // Treat auth endpoints strictly: 401/403 means the API key is missing/invalid,
        // which is exactly what we want to surface for reliability.
        // For public endpoints, a 401/403 can still be a useful "reachable" signal.
        const ok = t.requiresAuth
          ? res.ok
          : res.ok || res.status === 401 || res.status === 403;

        return {
          name: t.name,
          url: t.url,
          category: t.category,
          status: res.status,
          ok,
          ms,
        } satisfies CheckResult;
      } catch (e: unknown) {
        const ms = Date.now() - s;
        const errObj = e as { name?: unknown; message?: unknown };
        const errName = typeof errObj?.name === "string" ? errObj.name : "";
        const errMsg =
          typeof errObj?.message === "string" ? errObj.message : "error";

        return {
          name: t.name,
          url: t.url,
          category: t.category,
          status: 0,
          ok: false,
          ms,
          error: errName === "AbortError" ? "timeout" : errMsg,
        } satisfies CheckResult;
      }
    })
  );

  const ok = results.every((r) => r.ok);

  return {
    ok,
    checkedAt: new Date().toISOString(),
    totalMs: Date.now() - startedAt,
    results,
    authEnabled,
    authProbesIncluded: authEnabled ? authTargets.length : 0,
  };
}

export const getCachedProbe = unstable_cache(
  async (userAgent: string) => performProbe(userAgent),
  ["moltbook-status-check"],
  { revalidate: 300 }
);
