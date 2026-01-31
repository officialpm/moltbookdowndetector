"use client";

type LatencyBarProps = {
  ms: number;
  maxMs?: number;
};

function getLatencyColor(ms: number): string {
  if (ms < 200) return "bg-emerald-500";
  if (ms < 500) return "bg-emerald-400";
  if (ms < 1000) return "bg-yellow-500";
  if (ms < 2000) return "bg-orange-500";
  return "bg-red-500";
}

function getLatencyLabel(ms: number): string {
  if (ms < 200) return "Excellent";
  if (ms < 500) return "Good";
  if (ms < 1000) return "Fair";
  if (ms < 2000) return "Slow";
  return "Very Slow";
}

export default function LatencyBar({ ms, maxMs = 3000 }: LatencyBarProps) {
  const percentage = Math.min((ms / maxMs) * 100, 100);
  const color = getLatencyColor(ms);
  const label = getLatencyLabel(ms);

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-zinc-500">{label}</span>
    </div>
  );
}
