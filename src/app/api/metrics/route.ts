import { NextResponse } from "next/server";
import { getCachedProbe } from "@/lib/probe";
import { APP_NAME, APP_VERSION } from "@/lib/version";

export const runtime = "nodejs";
export const revalidate = 300;

function escLabelValue(s: string) {
  // Prometheus label escaping: backslash, double-quote, newline
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/\"/g, "\\\"");
}

function line(name: string, labels: Record<string, string>, value: number) {
  const labelStr = Object.entries(labels)
    .map(([k, v]) => `${k}="${escLabelValue(v)}"`)
    .join(",");
  return `${name}${labelStr ? `{${labelStr}}` : ""} ${value}`;
}

export async function GET() {
  const data = await getCachedProbe(
    `${APP_NAME}/${APP_VERSION} (+https://github.com/officialpm/moltbookdowndetector)`
  );

  const out: string[] = [];
  out.push(`# ${APP_NAME} metrics`);
  out.push(`# scraped_at ${new Date().toISOString()}`);
  out.push(`# checked_at ${data.checkedAt}`);

  out.push("# HELP moltbook_probe_ok Overall probe status (1=ok, 0=degraded)");
  out.push("# TYPE moltbook_probe_ok gauge");
  out.push(line("moltbook_probe_ok", {}, data.ok ? 1 : 0));

  out.push("# HELP moltbook_probe_total_ms Total probe wall time in milliseconds");
  out.push("# TYPE moltbook_probe_total_ms gauge");
  out.push(line("moltbook_probe_total_ms", {}, data.totalMs));

  out.push("# HELP moltbook_endpoint_ok Endpoint status (1=ok, 0=fail)");
  out.push("# TYPE moltbook_endpoint_ok gauge");

  out.push("# HELP moltbook_endpoint_latency_ms Endpoint latency in milliseconds");
  out.push("# TYPE moltbook_endpoint_latency_ms gauge");

  out.push("# HELP moltbook_endpoint_http_status Last observed HTTP status (0 on network error/timeout)");
  out.push("# TYPE moltbook_endpoint_http_status gauge");

  for (const r of data.results || []) {
    const labels = {
      endpoint: r.name,
      category: r.category,
      url: r.url,
    };

    out.push(line("moltbook_endpoint_ok", labels, r.ok ? 1 : 0));
    out.push(line("moltbook_endpoint_latency_ms", labels, r.ms));
    out.push(line("moltbook_endpoint_http_status", labels, r.status));
  }

  return new NextResponse(out.join("\n") + "\n", {
    status: 200,
    headers: {
      "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
    },
  });
}
