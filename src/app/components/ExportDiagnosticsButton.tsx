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
    </div>
  );
}
