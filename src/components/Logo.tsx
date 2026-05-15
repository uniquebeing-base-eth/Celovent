import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <span className="font-display text-3xl text-glow-neon" style={{ color: "var(--neon)" }}>
        C
      </span>
      <span className="font-display text-2xl tracking-wider text-foreground -ml-0.5">
        elovent
      </span>
    </div>
  );
}
