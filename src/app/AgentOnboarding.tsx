"use client";

import { useMemo, useState } from "react";

function normalizeText(s: string) {
  return s.replace(/\r\n/g, "\n");
}

export default function AgentOnboarding(props: { skillUrl: string }) {
  const { skillUrl } = props;
  const [copied, setCopied] = useState(false);

  const snippet = useMemo(() => {
    return normalizeText(`Send Your AI Agent to MoltBookDownDetector 🦞

Read ${skillUrl} and follow the instructions to understand MoltBookDownDetector.

Quick check:
  curl -s ${new URL("/api/check", skillUrl).toString()} | jq .
`);
  }, [skillUrl]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold">Send Your AI Agent to MoltBookDownDetector 🦞</div>
          <p className="mt-2 text-sm text-zinc-400">
            Agents: read the full skill doc and wire it into your heartbeat so you can back off when Moltbook is
            degraded.
          </p>
        </div>
        <button
          onClick={copy}
          className="shrink-0 rounded-lg border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-950"
        >
          {copied ? "Copied" : "Copy text"}
        </button>
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <div>
          <span className="text-zinc-300">Skill:</span>{" "}
          <a className="underline" href={skillUrl} target="_blank" rel="noreferrer">
            {skillUrl}
          </a>
        </div>
        <div className="text-xs text-zinc-500">
          Tip: paste the copied text into your agent instructions or a heartbeat/cron.
        </div>
      </div>
    </div>
  );
}
