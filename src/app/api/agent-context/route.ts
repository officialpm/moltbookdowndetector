import { NextResponse } from "next/server";
import { getCachedProbe, type ProbeResponse } from "@/lib/probe";
import { getProbeRegion } from "@/lib/runtime";
import { APP_NAME, APP_VERSION } from "@/lib/version";

export const runtime = "nodejs";
export const revalidate = 300;

type AgentContextJson = {
  ok: boolean;
  checkedAt: string;
  /** Best-effort runtime region for the probe (helps debug region-specific issues). */
  probeRegion?: string;
  action: "OK" | "BACKOFF";
  recommendedBackoffMinutes: number;
  /** Human/agent-readable summary (safe to paste into a system prompt). */
  summary: string;
  /** Copy-paste snippet for agent instructions/heartbeats. */
  integrationSnippetMarkdown: string;
  /** OpenClaw-oriented snippet (paste into HEARTBEAT.md or agent instructions). */
  openclawSnippetMarkdown: string;
  failures: Array<{ name: string; category: string; status: number; ms: number; error?: string }>;
  degraded: Array<{ name: string; category: string; status: number; ms: number; error?: string }>;
};

function buildContext(
  data: ProbeResponse,
  baseUrl: string,
  opts?: { probeRegion?: string }
): AgentContextJson {
  const failures = (data.results || []).filter((r) => !r.ok);
  const degraded = (data.results || []).filter((r) => r.ok && r.ms >= 2500);
  const ok = failures.length === 0;
  const recommendedBackoffMinutes = ok ? 0 : 20;

  const worst = (data.results || [])
    .filter((r) => Number.isFinite(r.ms))
    .slice()
    .sort((a, b) => b.ms - a.ms)[0];

  const failuresLine = failures.length
    ? `Failures: ${failures
        .slice(0, 4)
        .map((f) => `${f.name} (${f.category}, ${f.status || f.error || "err"})`)
        .join(", ")}${failures.length > 4 ? ` (+${failures.length - 4} more)` : ""}.`
    : "No failing probes.";

  const degradedLine = degraded.length
    ? `Degraded (slow): ${degraded
        .slice(0, 4)
        .map((d) => `${d.name} (${d.ms}ms)`)
        .join(", ")}${degraded.length > 4 ? ` (+${degraded.length - 4} more)` : ""}.`
    : "No degraded probes.";

  const summary = [
    `Moltbook status from MoltBookDownDetector (${baseUrl}): ${ok ? "OK" : "DEGRADED"}.`,
    `Checked at ${data.checkedAt}.`,
    opts?.probeRegion ? `Probe region: ${opts.probeRegion}.` : undefined,
    `Action: ${ok ? "OK" : `BACKOFF (~${recommendedBackoffMinutes}m)`}.`,
    worst ? `Worst latency: ${worst.name} (${worst.ms}ms).` : undefined,
    failuresLine,
    degradedLine,
    ok
      ? "Guidance: proceed normally. If you still see failures, compare with your own region/auth and retry with exponential backoff."
      : "Guidance: back off writes (posting/commenting) and reduce Moltbook traffic; retry after the backoff window.",
  ]
    .filter(Boolean)
    .join("\n");

  const agentCheckUrl = new URL("/api/agent-check", baseUrl).toString();
  const agentCheckTextUrl = new URL("/api/agent-check?format=text", baseUrl).toString();
  const agentContextUrl = new URL("/api/agent-context", baseUrl).toString();
  const agentContextJsonUrl = new URL("/api/agent-context?format=json", baseUrl).toString();

  const integrationSnippetMarkdown = `## Moltbook reliability check (every 10–30m)\n1) GET ${agentCheckUrl}\n2) Also fetch context: ${agentContextUrl} (paste summary into logs)\n3) If action=BACKOFF: pause writes for recommendedBackoffMinutes and retry later\n4) If action=OK: proceed normally\n`;

  const openclawSnippetMarkdown = `## OpenClaw integration (quick copy/paste)\n\n### HEARTBEAT.md\nAdd a line like:\n\n- Moltbook reliability: ${agentCheckTextUrl}\n\nOptional: also capture context (Markdown) when investigating incidents:\n\n- Moltbook context: ${agentContextUrl}\n\n### Cron (agent reminder)\nIf your agent runtime supports scheduled reminders, run this every 10–30 minutes and alert if ok=false:\n\n- JSON check: ${agentCheckUrl}\n- JSON context: ${agentContextJsonUrl}\n`;

  return {
    ok,
    checkedAt: data.checkedAt,
    ...(opts?.probeRegion ? { probeRegion: opts.probeRegion } : {}),
    action: ok ? "OK" : "BACKOFF",
    recommendedBackoffMinutes,
    summary,
    integrationSnippetMarkdown,
    openclawSnippetMarkdown,
    failures: failures.map((r) => ({
      name: r.name,
      category: r.category,
      status: r.status,
      ms: r.ms,
      error: r.error,
    })),
    degraded: degraded.map((r) => ({
      name: r.name,
      category: r.category,
      status: r.status,
      ms: r.ms,
      error: r.error,
    })),
  };
}

function toMarkdown(ctx: AgentContextJson): string {
  return [
    `# MoltBookDownDetector — Agent Context`,
    ``,
    `**Status:** ${ctx.ok ? "OK" : "DEGRADED"}`,
    `**Checked at:** ${ctx.checkedAt}`,
    `**Action:** ${ctx.action}${ctx.action === "BACKOFF" ? ` (suggested backoff: ${ctx.recommendedBackoffMinutes}m)` : ""}`,
    ``,
    `## Summary`,
    ``,
    ctx.summary,
    ``,
    `## Integration snippet (copy/paste)`,
    ``,
    "```markdown",
    ctx.integrationSnippetMarkdown.trimEnd(),
    "```",
    ``,
    `## OpenClaw snippet (copy/paste)`,
    ``,
    "```markdown",
    ctx.openclawSnippetMarkdown.trimEnd(),
    "```",
  ].join("\n");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const format = (url.searchParams.get("format") || "md").toLowerCase();

  const baseUrl = `${url.protocol}//${url.host}`;

  const data = await getCachedProbe(
    `${APP_NAME}/${APP_VERSION} (+https://github.com/officialpm/moltbookdowndetector)`
  );

  const probeRegion = getProbeRegion(request);

  const ctx = buildContext(data, baseUrl, { probeRegion });

  if (format === "json") {
    return NextResponse.json(ctx, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  }

  const md = toMarkdown(ctx);

  return new NextResponse(md, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
    },
  });
}
