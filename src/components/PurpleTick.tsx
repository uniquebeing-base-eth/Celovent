import { cn } from "@/lib/utils";

export function PurpleTick({ className, size = 14 }: { className?: string; size?: number }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-[var(--purple-tick)] animate-shimmer shrink-0",
        className,
      )}
      style={{ width: size, height: size }}
      aria-label="Verified AI Creator"
      title="Verified AI Creator"
    >
      <svg viewBox="0 0 24 24" width={size * 0.7} height={size * 0.7} fill="none">
        <path
          d="M5 12.5l4 4L19 7"
          stroke="white"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
