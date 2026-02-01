"use client";

import { useMemo, useState } from "react";

export type DiagnosticsPayload = {
  app: {
    name: string;
    version?: string;
  };
  generatedAt: string;
  pageUrl?: string;
  userAgent?: string;
  lastProbe?: unknown;
  history?: unknown;
};

type LastProbeShape = {
  ok?: boolean;
  checkedAt?: string;
  probeRegion?: string;
  totalMs?: number;
  results?: Array<{
    name: string;
    url: string;
    category?: string;
    ok: boolean;
    ms: number;
    status?: number;
    error?: string;
  }>;
};

type HistoryEntryShape = {
  timestamp: string;
  ok: boolean;
  totalMs: number;
  results: Array<{
    name: string;
    ok: boolean;
    ms: number;
    status?: number;
    error?: string;
  }>;
};

function isObject(x: unknown): x is Record<string, unknown> {
  return Boolean(x) && typeof x === "object";
}

function asLastProbe(x: unknown): LastProbeShape | null {
  if (!isObject(x)) return null;
  return x as LastProbeShape;
}

function asHistory(x: unknown): HistoryEntryShape[] {
  if (!Array.isArray(x)) return [];
  return x.filter((e) => isObject(e)) as HistoryEntryShape[];
}

function summarizeIncidentMarkdown(args: {
  appName: string;
  appVersion?: string;
  pageUrl?: string;
  lastProbe?: unknown;
  history?: unknown;
}) {
  const last = asLastProbe(args.lastProbe);
  const history = asHistory(args.history);

  const newest = history[0]?.timestamp;
  const oldest = history[history.length - 1]?.timestamp;

  const nameToPath = new Map<string, string>();
  for (const r of last?.results || []) {
    try {
      nameToPath.set(r.name, new URL(r.url).pathname);
    } catch {
      // ignore
    }
  }

  const recentBad = history
    .filter((h) => h.ok === false || (h.results || []).some((rr) => rr.error === "timeout"))
    .slice(0, 5);

  const lines: string[] = [];
  lines.push(`# ${args.appName}${args.appVersion ? ` v${args.appVersion}` : ""} — Incident Summary`);
  lines.push("");
  if (args.pageUrl) lines.push(`Page: ${args.pageUrl}`);
  if (last?.checkedAt) lines.push(`Last check: ${last.checkedAt}${last.probeRegion ? ` (region: ${last.probeRegion})` : ""}`);
  if (typeof last?.ok === "boolean" && typeof last?.totalMs === "number") {
    lines.push(`Overall: ${last.ok ? "OK" : "DEGRADED"} · total ${last.totalMs}ms`);
  } else if (typeof last?.ok === "boolean") {
    lines.push(`Overall: ${last.ok ? "OK" : "DEGRADED"}`);
  }
  if (newest && oldest && history.length) {
    lines.push(`Local window: ${history.length} checks (${newest} → ${oldest})`);
  }
  lines.push("");

  if (!recentBad.length) {
    lines.push(`No incidents detected in the last ${history.length} local checks.`);
    return lines.join("\n");
  }

  lines.push("## Recent incident points (latest first)");
  for (const h of recentBad) {
    const failing = (h.results || []).filter((r) => r.ok === false);
    const timeouts = (h.results || []).filter((r) => r.error === "timeout");

    const bulletParts: string[] = [];
    if (h.ok === false) bulletParts.push(`overall failed`);
    if (timeouts.length) bulletParts.push(`${timeouts.length} timeout(s)`);
    if (failing.length && h.ok !== false) bulletParts.push(`${failing.length} failing endpoint(s)`);

    lines.push(`- ${h.timestamp}: ${bulletParts.join(" · ") || "issue"}`);

    for (const r of failing.slice(0, 6)) {
      const p = nameToPath.get(r.name);
      const suffix = p ? ` (${p})` : "";
      const err = r.error ? ` — ${r.error}` : typeof r.status === "number" ? ` — HTTP ${r.status}` : "";
      lines.push(`  - ${r.name}${suffix}: FAIL${err}`);
    }

    if (failing.length > 6) {
      lines.push(`  - …and ${failing.length - 6} more failing endpoints`);
    }
  }

  lines.push("");
  lines.push("## Agent guidance");
  lines.push("- If Moltbook is degraded, back off writes (posting/commenting) and retry later.");
  lines.push("- Consider scoping checks by category/endpoint via /api/agent-check?category=api or ?name=…");

  return lines.join("\n");
}

function downloadJson(filename: string, data: unknown) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export default function ExportDiagnosticsButton(props: {
  appName: string;
  appVersion?: string;
  lastProbe?: unknown;
  history?: unknown;
}) {
  const { appName, appVersion, lastProbe, history } = props;
  const [copied, setCopied] = useState(false);
  const [copiedIncident, setCopiedIncident] = useState(false);

  const payload: DiagnosticsPayload = useMemo(
    () => ({
      app: { name: appName, ...(appVersion ? { version: appVersion } : {}) },
      generatedAt: new Date().toISOString(),
      ...(typeof window !== "undefined" ? { pageUrl: window.location.href } : {}),
      ...(typeof navigator !== "undefined" ? { userAgent: navigator.userAgent } : {}),
      ...(typeof lastProbe !== "undefined" ? { lastProbe } : {}),
      ...(typeof history !== "undefined" ? { history } : {}),
    }),
    [appName, appVersion, lastProbe, history]
  );

  const disabled = !lastProbe;

  const incidentMarkdown = useMemo(() => {
    return summarizeIncidentMarkdown({
      appName,
      appVersion,
      ...(typeof window !== "undefined" ? { pageUrl: window.location.href } : {}),
      lastProbe,
      history,
    });
  }, [appName, appVersion, lastProbe, history]);

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  }

  function download() {
    const v = appVersion ? `-${appVersion}` : "";
    downloadJson(`moltbookdowndetector-diagnostics${v}.json`, payload);
  }

  async function copyIncident() {
    try {
      await navigator.clipboard.writeText(incidentMarkdown);
      setCopiedIncident(true);
      setTimeout(() => setCopiedIncident(false), 1200);
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={disabled}
        onClick={download}
        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-all ${
          disabled
            ? "border-zinc-800 bg-zinc-950/30 text-zinc-600"
            : "border-zinc-700 bg-zinc-900/60 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800/60"
        }`}
        title={disabled ? "Load status first" : "Download diagnostics JSON"}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
          />
        </svg>
        Export
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={copyJson}
        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-all ${
          disabled
            ? "border-zinc-800 bg-zinc-950/30 text-zinc-600"
            : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:border-emerald-500/50 hover:bg-emerald-500/20"
        }`}
        title={disabled ? "Load status first" : "Copy diagnostics JSON to clipboard"}
      >
        {copied ? (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Copied
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Copy JSON
          </>
        )}
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={copyIncident}
        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-all ${
          disabled
            ? "border-zinc-800 bg-zinc-950/30 text-zinc-600"
            : "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:border-amber-500/50 hover:bg-amber-500/15"
        }`}
        title={disabled ? "Load status first" : "Copy a paste-ready incident summary (Markdown)"}
      >
        {copiedIncident ? (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Copied
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7h8m-8 4h8m-8 4h6M6 3h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z"
              />
            </svg>
            Copy incident
          </>
        )}
      </button>
    </div>
  );
}
