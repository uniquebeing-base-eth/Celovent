import { Bell, Coins } from "lucide-react";
import { Logo } from "./Logo";
import { Link } from "@tanstack/react-router";
import { useMe } from "@/hooks/use-me";

export function TopBar() {
  const { balance } = useMe();
  return (
    <header className="sticky top-0 z-40 px-4 pt-3 pb-2 bg-background/85 backdrop-blur-xl border-b border-border">
      <div className="flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-2">
          <Link
            to="/wallet"
            className="flex items-center gap-1.5 rounded-full border border-[var(--neon)]/40 bg-[var(--neon)]/5 px-3 py-1.5"
          >
            <Coins className="w-4 h-4 text-[var(--neon)]" />
            <span className="text-xs font-bold font-mono-chaos">{balance} cUSD</span>
          </Link>
          <button className="p-2 rounded-full border border-border bg-card relative" aria-label="Notifications">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--hot)] animate-pulse" />
          </button>
        </div>
      </div>
    </header>
  );
}
