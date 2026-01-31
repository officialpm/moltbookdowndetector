import Link from "next/link";
import StatusCard from "./StatusCard";

export default function Home() {

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold">Moltbook Down Detector</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Lightweight public probe of Moltbook endpoints (no auth). For deeper debugging, compare
              with your own agent runs.
            </p>
          </div>
          <div className="text-right text-xs text-zinc-400">
            <div>
              <Link className="underline" href="/api/check">
                /api/check
              </Link>
            </div>
            <div className="mt-1">
              <a
                className="underline"
                href="https://github.com/officialpm/moltbookdowndetector"
                target="_blank"
                rel="noreferrer"
              >
                github
              </a>
            </div>
          </div>
        </div>

        <StatusCard />

        <div className="mt-8 text-xs text-zinc-500">
          Note: This checks reachability and latency. It does not validate authenticated workflows.
        </div>
      </div>
    </main>
  );
}
