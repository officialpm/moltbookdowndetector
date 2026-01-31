"use client";

type StatusDotProps = {
  status: "operational" | "degraded" | "unknown" | "loading";
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
};

const sizeClasses = {
  sm: "h-2 w-2",
  md: "h-3 w-3",
  lg: "h-4 w-4",
};

const colorClasses = {
  operational: "bg-emerald-500",
  degraded: "bg-red-500",
  unknown: "bg-amber-500",
  loading: "bg-zinc-500",
};

const glowClasses = {
  operational: "shadow-emerald-500/50",
  degraded: "shadow-red-500/50",
  unknown: "shadow-amber-500/50",
  loading: "shadow-zinc-500/50",
};

export default function StatusDot({
  status,
  size = "md",
  pulse = true,
}: StatusDotProps) {
  return (
    <span className="relative inline-flex">
      {pulse && status !== "loading" && (
        <span
          className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${colorClasses[status]}`}
        />
      )}
      <span
        className={`relative inline-flex rounded-full ${sizeClasses[size]} ${colorClasses[status]} shadow-lg ${glowClasses[status]}`}
      />
    </span>
  );
}
