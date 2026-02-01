import { NextResponse } from "next/server";
import { APP_NAME, APP_VERSION } from "@/lib/version";

export const runtime = "nodejs";

/**
 * Minimal OpenAPI 3.0 spec for MoltBookDownDetector.
 *
 * Goal: make it easy for agents / tooling to discover endpoints, parameters,
 * and response shapes (with JSON Schema links where useful).
 */
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;

  const spec = {
    openapi: "3.0.3",
    info: {
      title: "MoltBookDownDetector API",
      version: APP_VERSION,
      description:
        "Agent-friendly status probes for Moltbook uptime/reliability. Provides JSON, text, Markdown, badges, and Prometheus metrics.",
    },
    servers: [{ url: origin }],
    paths: {
      "/api/agent-check": {
        get: {
          summary: "Agent-friendly status check",
          description:
            "Returns a compact summary (OK/BACKOFF), plus failures and degraded endpoints. Supports scoping by category or endpoint name.",
          parameters: [
            {
              name: "category",
              in: "query",
              required: false,
              schema: { type: "string", enum: ["site", "api", "docs", "auth"] },
              description: "Limit probes to a single category.",
            },
            {
              name: "name",
              in: "query",
              required: false,
              schema: { type: "string" },
              description:
                "Limit probes to a single endpoint by its display name (URL-encode spaces).",
            },
            {
              name: "format",
              in: "query",
              required: false,
              schema: { type: "string", enum: ["json", "text", "plain", "md", "markdown"] },
              description:
                "Response format. Defaults to json; supports text/plain and text/markdown.",
            },
          ],
          responses: {
            "200": {
              description: "Agent check response",
              content: {
                "application/json": {
                  schema: {
                    $ref: "/api/agent-check/schema",
                  },
                },
                "text/plain": {
                  schema: { type: "string" },
                },
                "text/markdown": {
                  schema: { type: "string" },
                },
              },
            },
            "400": { description: "Invalid query" },
            "404": { description: "Scope requested but no matching probes exist" },
          },
        },
      },

      "/api/agent-check/schema": {
        get: {
          summary: "JSON Schema for /api/agent-check response",
          responses: {
            "200": {
              description: "JSON Schema",
              content: { "application/json": { schema: { type: "object" } } },
            },
          },
        },
      },

      "/api/agent-context": {
        get: {
          summary: "Agent-readable integration context",
          parameters: [
            {
              name: "format",
              in: "query",
              required: false,
              schema: { type: "string", enum: ["md", "markdown", "json"] },
              description:
                "Response format. Defaults to Markdown; use json for structured output.",
            },
          ],
          responses: {
            "200": {
              description: "Context payload",
              content: {
                "text/markdown": { schema: { type: "string" } },
                "application/json": { schema: { type: "object" } },
              },
            },
          },
        },
      },

      "/api/status": {
        get: {
          summary: "Dashboard-friendly status JSON",
          responses: {
            "200": {
              description: "Status",
              content: { "application/json": { schema: { type: "object" } } },
            },
          },
        },
      },

      "/api/check": {
        get: {
          summary: "Full raw probe results",
          responses: {
            "200": {
              description: "Probe results",
              content: { "application/json": { schema: { type: "object" } } },
            },
          },
        },
      },

      "/api/badge": {
        get: {
          summary: "Status badge (SVG)",
          parameters: [
            {
              name: "category",
              in: "query",
              required: false,
              schema: { type: "string", enum: ["site", "api", "docs", "auth"] },
              description: "Badge scoped to category.",
            },
            {
              name: "name",
              in: "query",
              required: false,
              schema: { type: "string" },
              description: "Badge scoped to endpoint name.",
            },
          ],
          responses: {
            "200": {
              description: "SVG badge",
              content: { "image/svg+xml": { schema: { type: "string" } } },
            },
          },
        },
      },

      "/api/metrics": {
        get: {
          summary: "Prometheus metrics",
          responses: {
            "200": {
              description: "Prometheus exposition format",
              content: { "text/plain": { schema: { type: "string" } } },
            },
          },
        },
      },

      "/api/openapi": {
        get: {
          summary: "OpenAPI spec (this document)",
          responses: {
            "200": {
              description: "OpenAPI JSON",
              content: { "application/json": { schema: { type: "object" } } },
            },
          },
        },
      },
    },
    tags: [
      { name: "agent", description: "Agent-friendly endpoints" },
      { name: "status", description: "Status endpoints" },
      { name: "meta", description: "Discovery / metadata" },
    ],
    "x-app": {
      name: APP_NAME,
      version: APP_VERSION,
      repo: "https://github.com/officialpm/moltbookdowndetector",
    },
  };

  return NextResponse.json(spec, {
    headers: {
      // This is small and safe to cache, but varies by host (origin), so keep it short.
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
    },
  });
}
