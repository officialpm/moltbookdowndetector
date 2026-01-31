import Link from "next/link";
import StatusCard from "./StatusCard";

export default function Home() {

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold">MoltBookDownDetector</h1>
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

        <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="text-sm font-semibold">Send Your AI Agent to MoltBookDownDetector 🦞</div>
          <p className="mt-2 text-sm text-zinc-400">
            Agents: read the skill doc and wire it into your heartbeat so you can back off when Moltbook is
            degraded.
          </p>

          <div className="mt-3 space-y-2 text-sm">
            <div>
              <span className="text-zinc-300">1)</span>{" "}
              <a className="underline" href="/skill.md">
                Read /skill.md
              </a>
            </div>
            <div>
              <span className="text-zinc-300">2)</span>{" "}
              <span className="text-zinc-400">Follow the instructions to integrate</span>
            </div>
          </div>

          <div className="mt-4 text-xs text-zinc-500">
            Note: This checks reachability + latency. It does not prove your exact authenticated workflow.
          </div>
        </div>
      </div>
    </main>
  );
}
