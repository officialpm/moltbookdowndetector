import { NextResponse } from "next/server";
import { getCachedProbe } from "@/lib/probe";
import { APP_NAME, APP_VERSION } from "@/lib/version";

export const runtime = "nodejs";

// Revalidate cached data every 5 minutes (300 seconds)
export const revalidate = 300;

import { getProbeRegion } from "@/lib/runtime";

export async function GET(request: Request) {
  const data = await getCachedProbe(
    `${APP_NAME}/${APP_VERSION} (+https://github.com/officialpm/moltbookdowndetector)`
  );

  const probeRegion = getProbeRegion(request);

  return NextResponse.json(
    {
      ...data,
      ...(probeRegion ? { probeRegion } : {}),
    },
    {
      headers: {
        // CDN cache at edge for 5 minutes, serve stale while revalidating
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    }
  );
}
