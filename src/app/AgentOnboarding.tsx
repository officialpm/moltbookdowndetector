"use client";

import { useMemo, useState } from "react";

function normalizeText(s: string) {
  return s.replace(/\r\n/g, "\n");
}

export default function AgentOnboarding(props: { skillUrl?: string }) {
  const inferredBase = useMemo(() => {
    if (props.skillUrl) return props.skillUrl;
    if (typeof window === "undefined") return "https://moltbookdowndetector.vercel.app/skill.md";
    return new URL("/skill.md", window.location.origin).toString();
  }, [props.skillUrl]);

  const skillUrl = inferredBase;
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const badgeUrl = new URL("/api/badge", skillUrl).toString();
  const endpointBadgeUrl = new URL(
    "/api/badge?name=Posts%20Feed",
    skillUrl
  ).toString();
  const categoryBadgeUrl = new URL("/api/badge?category=api", skillUrl).toString();

  const snippet = useMemo(() => {
    return normalizeText(`Send Your AI Agent to MoltBookDownDetector 🦞

Read ${skillUrl} and follow the instructions to understand MoltBookDownDetector.

Status badges (Markdown):
  Overall: ![Moltbook status](${badgeUrl})
  API category: ![API status](${categoryBadgeUrl})
  One endpoint: ![Posts Feed](${endpointBadgeUrl})

Quick check (JSON):
  curl -s ${new URL("/api/agent-check", skillUrl).toString()} | jq .

Status JSON (dashboard-friendly):
  curl -s ${new URL("/api/status", skillUrl).toString()} | jq .

Quick check (paste-friendly text):
  curl -s ${new URL("/api/agent-check?format=text", skillUrl).toString()}

Agent context (Markdown, paste into logs/prompts):
  curl -s ${new URL("/api/agent-context", skillUrl).toString()}

OpenClaw HEARTBEAT.md (paste as a task line):
  Moltbook reliability: ${new URL("/api/agent-check?format=text", skillUrl).toString()}

OpenClaw optional (extra context):
  Moltbook context: ${new URL("/api/agent-context", skillUrl).toString()}

Scoped checks (useful for agents that only care about a surface):
  API-only: curl -s ${new URL("/api/agent-check?category=api", skillUrl).toString()} | jq .
  One endpoint: curl -s ${new URL("/api/agent-check?name=Posts%20Feed", skillUrl).toString()} | jq .

OpenAPI discovery (JSON):
  curl -s ${new URL("/api/openapi", skillUrl).toString()} | jq .

Prometheus metrics:
  curl -s ${new URL("/api/metrics", skillUrl).toString()} | head
`);
  }, [skillUrl, badgeUrl, endpointBadgeUrl, categoryBadgeUrl]);

  const curlCommand = `curl -s ${new URL("/api/agent-check", skillUrl).toString()} | jq .`;
  const curlCommandText = `curl -s ${new URL(
    "/api/agent-check?format=text",
    skillUrl
  ).toString()}`;
  const curlCommandContext = `curl -s ${new URL("/api/agent-context", skillUrl).toString()}`;
  const openclawHeartbeatLine = `Moltbook reliability: ${new URL(
    "/api/agent-check?format=text",
    skillUrl
  ).toString()}`;
  const openclawContextLine = `Moltbook context: ${new URL(
    "/api/agent-context",
    skillUrl
  ).toString()}`;
  const curlCommandApi = `curl -s ${new URL(
    "/api/agent-check?category=api",
    skillUrl
  ).toString()} | jq .`;
  const curlCommandPosts = `curl -s ${new URL(
    "/api/agent-check?name=Posts%20Feed",
    skillUrl
  ).toString()} | jq .`;
  const markdownBadge = `![Moltbook status](${badgeUrl})`;
  const markdownBadgeApi = `![API status](${categoryBadgeUrl})`;
  const markdownBadgePosts = `![Posts Feed](${endpointBadgeUrl})`;

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900/80 via-zinc-900/60 to-zinc-900/40 backdrop-blur-sm">
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber-500/5 via-orange-500/5 to-transparent rounded-full blur-3xl" />

      <div className="relative p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-xl">
              🤖
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Agent Integration
              </h2>
              <p className="text-sm text-zinc-500">
                Wire this into your agent&apos;s heartbeat
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCode(!showCode)}
              className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-xs text-zinc-300 transition-all hover:border-zinc-600 hover:bg-zinc-800/60"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                />
              </svg>
              {showCode ? "Hide" : "Show"} Code
            </button>
            <button
              onClick={() => copy(snippet)}
              className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400 transition-all hover:border-emerald-500/50 hover:bg-emerald-500/20"
            >
              {copied ? (
                <>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 transition-all hover:border-zinc-700">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-xs">
                1
              </span>
              Read Skill Doc
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              Fetch the skill.md to understand the integration
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 transition-all hover:border-zinc-700">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-xs">
                2
              </span>
              Check Status
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              Call /api/agent-check every 10-30 minutes
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 transition-all hover:border-zinc-700">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-xs">
                3
              </span>
              Backoff if Down
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              Reduce activity when ok=false
            </p>
          </div>
        </div>

        {showCode && (
          <div className="mt-4 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/60">
            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
              <span className="text-xs text-zinc-500">Quick test</span>
              <button
                onClick={() => copy(curlCommand)}
                className="text-xs text-zinc-400 hover:text-zinc-300"
              >
                Copy
              </button>
            </div>
            <pre className="overflow-x-auto p-4 text-sm text-emerald-400">
              <code>{curlCommand}</code>
            </pre>

            <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-2">
              <span className="text-xs text-zinc-500">Quick test (paste-friendly text)</span>
              <button
                onClick={() => copy(curlCommandText)}
                className="text-xs text-zinc-400 hover:text-zinc-300"
              >
                Copy
              </button>
            </div>
            <pre className="overflow-x-auto p-4 text-sm text-emerald-400">
              <code>{curlCommandText}</code>
            </pre>

            <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-2">
              <span className="text-xs text-zinc-500">Agent context (Markdown)</span>
              <button
                onClick={() => copy(curlCommandContext)}
                className="text-xs text-zinc-400 hover:text-zinc-300"
              >
                Copy
              </button>
            </div>
            <pre className="overflow-x-auto p-4 text-sm text-emerald-400">
              <code>{curlCommandContext}</code>
            </pre>

            <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-2">
              <span className="text-xs text-zinc-500">OpenClaw HEARTBEAT.md task line</span>
              <button
                onClick={() => copy(openclawHeartbeatLine)}
                className="text-xs text-zinc-400 hover:text-zinc-300"
              >
                Copy
              </button>
            </div>
            <pre className="overflow-x-auto p-4 text-sm text-emerald-400">
              <code>{openclawHeartbeatLine}</code>
            </pre>

            <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-2">
              <span className="text-xs text-zinc-500">OpenClaw optional: context task line</span>
              <button
                onClick={() => copy(openclawContextLine)}
                className="text-xs text-zinc-400 hover:text-zinc-300"
              >
                Copy
              </button>
            </div>
            <pre className="overflow-x-auto p-4 text-sm text-emerald-400">
              <code>{openclawContextLine}</code>
            </pre>

            <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-2">
              <span className="text-xs text-zinc-500">Scoped check: API category</span>
              <button
                onClick={() => copy(curlCommandApi)}
                className="text-xs text-zinc-400 hover:text-zinc-300"
              >
                Copy
              </button>
            </div>
            <pre className="overflow-x-auto p-4 text-sm text-emerald-400">
              <code>{curlCommandApi}</code>
            </pre>

            <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-2">
              <span className="text-xs text-zinc-500">Scoped check: Posts Feed endpoint</span>
              <button
                onClick={() => copy(curlCommandPosts)}
                className="text-xs text-zinc-400 hover:text-zinc-300"
              >
                Copy
              </button>
            </div>
            <pre className="overflow-x-auto p-4 text-sm text-emerald-400">
              <code>{curlCommandPosts}</code>
            </pre>

            <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-2">
              <span className="text-xs text-zinc-500">Status badge (Markdown)</span>
              <button
                onClick={() => copy(markdownBadge)}
                className="text-xs text-zinc-400 hover:text-zinc-300"
              >
                Copy
              </button>
            </div>
            <pre className="overflow-x-auto p-4 text-sm text-emerald-400">
              <code>{markdownBadge}</code>
            </pre>

            <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-2">
              <span className="text-xs text-zinc-500">Category badge: API (Markdown)</span>
              <button
                onClick={() => copy(markdownBadgeApi)}
                className="text-xs text-zinc-400 hover:text-zinc-300"
              >
                Copy
              </button>
            </div>
            <pre className="overflow-x-auto p-4 text-sm text-emerald-400">
              <code>{markdownBadgeApi}</code>
            </pre>

            <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-2">
              <span className="text-xs text-zinc-500">Endpoint badge: Posts Feed (Markdown)</span>
              <button
                onClick={() => copy(markdownBadgePosts)}
                className="text-xs text-zinc-400 hover:text-zinc-300"
              >
                Copy
              </button>
            </div>
            <pre className="overflow-x-auto p-4 text-sm text-emerald-400">
              <code>{markdownBadgePosts}</code>
            </pre>
          </div>
        )}

        <div className="mt-4 flex items-center gap-4 text-xs">
          <a
            className="flex items-center gap-1 text-zinc-400 transition-colors hover:text-zinc-300"
            href={skillUrl}
            target="_blank"
            rel="noreferrer"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            skill.md
          </a>
          <span className="text-zinc-600">·</span>
          <a
            className="flex items-center gap-1 text-zinc-400 transition-colors hover:text-zinc-300"
            href={new URL("/api/agent-check/schema", skillUrl).toString()}
            target="_blank"
            rel="noreferrer"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6 4h6a2 2 0 002-2V7a2 2 0 00-2-2H9a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            schema
          </a>
          <span className="text-zinc-600">·</span>
          <a
            className="flex items-center gap-1 text-zinc-400 transition-colors hover:text-zinc-300"
            href={new URL("/api/openapi", skillUrl).toString()}
            target="_blank"
            rel="noreferrer"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
            openapi
          </a>
          <span className="text-zinc-600">·</span>
          <a
            className="flex items-center gap-1 text-zinc-400 transition-colors hover:text-zinc-300"
            href={badgeUrl}
            target="_blank"
            rel="noreferrer"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
            badge
          </a>
          <span className="text-zinc-600">·</span>
          <span className="text-zinc-500">
            Tip: paste the copied text into your agent instructions
          </span>
        </div>
      </div>
    </div>
  );
}
