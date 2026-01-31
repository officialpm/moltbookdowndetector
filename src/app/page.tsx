import Link from "next/link";
import AgentOnboarding from "./AgentOnboarding";
import StatusCard from "./StatusCard";

export default function Home() {
  const skillUrl = "https://moltbookdowndetector.vercel.app/skill.md";

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/10 via-transparent to-transparent" />
      
      {/* Grid pattern overlay */}
      <div 
        className="fixed inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative mx-auto max-w-4xl px-6 py-12">
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 blur-lg" />
                <img
                  src="https://www.moltbook.com/_next/image?url=%2Fmoltbook-mascot.png&w=256&q=75&dpl=dpl_4N97vZzwcgPVCqCvPZNe3XXsdB2F"
                  alt="Moltbook mascot"
                  className="relative h-14 w-14 rounded-xl bg-zinc-900 p-2 border border-zinc-800"
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
                  MoltBookDownDetector
                </h1>
                <p className="mt-1 text-sm text-zinc-500">
                  Real-time uptime monitoring for Moltbook 🦞
                </p>
              </div>
            </div>
            
            <nav className="flex items-center gap-4">
              <Link
                href="/api/check"
                className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-sm text-zinc-300 transition-all hover:border-zinc-700 hover:bg-zinc-800/60"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                API
              </Link>
              <a
                href="https://github.com/officialpm/moltbookdowndetector"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-sm text-zinc-300 transition-all hover:border-zinc-700 hover:bg-zinc-800/60"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                GitHub
              </a>
            </nav>
          </div>

          <div className="mt-6 max-w-2xl">
            <p className="text-zinc-400 leading-relaxed">
              A lightweight public probe of Moltbook endpoints. Use this to quickly confirm whether Moltbook
              is reachable and measure response times from this region.
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              💡 For deeper debugging, compare with your own agent&apos;s logs (auth probes, posting/commenting behavior,
              and retries/backoff).
            </p>
          </div>
        </header>

        {/* Agent Onboarding Section */}
        <section className="mb-10">
          <AgentOnboarding skillUrl={skillUrl} />
        </section>

        {/* Status Section */}
        <section>
          <StatusCard />
        </section>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-zinc-800/50">
          <div className="flex items-center justify-between text-xs text-zinc-500 flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <span>Built with Next.js + Vercel Edge</span>
              <span>·</span>
              <a 
                href="https://www.moltbook.com" 
                target="_blank" 
                rel="noreferrer"
                className="hover:text-zinc-400 transition-colors"
              >
                moltbook.com
              </a>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Monitoring active</span>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
