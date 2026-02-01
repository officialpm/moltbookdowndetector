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

function fmtScope(scope?: { category?: string; name?: string }) {
  if (!scope || (!scope.category && !scope.name)) return "";
  const parts: string[] = [];
  if (scope.category) parts.push(`category=${scope.category}`);
  if (scope.name) parts.push(`name=${scope.name}`);
  return ` (${parts.join(", ")})`;
}

function toPlainText(resp: AgentCheckResponse): string {
  const scope = fmtScope(resp.scope);
  if (resp.ok) {
    const degradedNote = resp.degraded.length
      ? `; degraded: ${resp.degraded.map((d) => d.name).join(", ")}`
      : "";
    return `OK${scope} — checkedAt=${resp.checkedAt}${degradedNote}`;
  }

  const lines: string[] = [];
  lines.push(
    `BACKOFF${scope} — checkedAt=${resp.checkedAt} — backoff=${resp.recommendedBackoffMinutes}m`
  );

  if (resp.failures.length) {
    lines.push("Failures:");
    for (const f of resp.failures) {
      const status = f.status ? `HTTP ${f.status}` : f.error || "error";
      const path = new URL(f.url).pathname;
      lines.push(`- ${f.name} [${f.category}] — ${status} — ${f.ms}ms — ${path}`);
    }
  }

  if (resp.degraded.length) {
    lines.push("Degraded (slow but OK):");
    for (const d of resp.degraded) {
      const path = new URL(d.url).pathname;
      lines.push(`- ${d.name} [${d.category}] — ${d.ms}ms — ${path}`);
    }
  }

  return lines.join("\n");
}

function toMarkdown(resp: AgentCheckResponse): string {
  const scope = fmtScope(resp.scope);
  if (resp.ok) {
    const degradedNote = resp.degraded.length
      ? `\n\n**Degraded (slow but OK):**\n${resp.degraded
          .map((d) => `- ${d.name} (${d.ms}ms)`)
          .join("\n")}`
      : "";
    return `**OK**${scope}\n\n- checkedAt: ${resp.checkedAt}${degradedNote}`;
  }

  const failures = resp.failures.length
    ? `\n\n**Failures:**\n${resp.failures
        .map((f) => {
          const status = f.status ? `HTTP ${f.status}` : f.error || "error";
          return `- ${f.name} [${f.category}] — ${status} — ${f.ms}ms`;
        })
        .join("\n")}`
    : "";

  const degraded = resp.degraded.length
    ? `\n\n**Degraded (slow but OK):**\n${resp.degraded
        .map((d) => `- ${d.name} [${d.category}] — ${d.ms}ms`)
        .join("\n")}`
    : "";

  return `**BACKOFF**${scope}\n\n- checkedAt: ${resp.checkedAt}\n- recommendedBackoffMinutes: ${resp.recommendedBackoffMinutes}${failures}${degraded}`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const category = url.searchParams.get("category") || undefined;
  const name = url.searchParams.get("name") || undefined;
  const format = (url.searchParams.get("format") || "json").toLowerCase();

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

  if (format === "text" || format === "plain") {
    return new NextResponse(toPlainText(resp), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  }

  if (format === "md" || format === "markdown") {
    return new NextResponse(toMarkdown(resp), {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  }

  return NextResponse.json(resp, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
    },
  });
}
