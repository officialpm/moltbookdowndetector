export function getProbeRegion(request: Request): string | undefined {
  // Best-effort: Vercel sets VERCEL_REGION in serverless/node runtimes.
  const envRegion = process.env.VERCEL_REGION;
  if (envRegion) return envRegion;

  // Fallback: parse x-vercel-id, which often begins with the region (e.g. "sfo1::...")
  const vercelId = request.headers.get("x-vercel-id") || "";
  if (vercelId) {
    const first = vercelId.split("::")[0]?.trim();
    if (first) return first;
  }

  // Some deployments may set alternate headers.
  const hdrRegion =
    request.headers.get("x-vercel-region") ||
    request.headers.get("x-vercel-execution-region") ||
    undefined;

  return hdrRegion || undefined;
}
