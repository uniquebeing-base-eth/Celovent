import { Link, useLocation } from "@tanstack/react-router";
import { Home, Search, Plus, Box, User } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = { to: string; icon: typeof Home; label: string; primary?: boolean };
const tabs: Tab[] = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/explore", icon: Search, label: "Explore" },
  { to: "/create", icon: Plus, label: "Create", primary: true },
  { to: "/memebox", icon: Box, label: "MemeBox" },
  { to: "/profile", icon: User, label: "Profile" },
];

export function MobileShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <div className="mx-auto max-w-[480px] relative">
        {children}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 px-3 pb-3 pt-2 bg-gradient-to-t from-background via-background/95 to-transparent">
          <div className="flex items-center justify-between rounded-3xl border border-border bg-card/90 backdrop-blur-xl px-2 py-2 shadow-2xl">
            {tabs.map((t) => {
              const active = location.pathname === t.to;
              const Icon = t.icon;
              if (t.primary) {
                return (
                  <Link
                    key={t.to}
                    to={t.to}
                    className="relative -mt-6 grid place-items-center w-14 h-14 rounded-2xl gradient-celo shadow-neon active:scale-95 transition-transform"
                    aria-label={t.label}
                  >
                    <Icon className="w-7 h-7 text-background" strokeWidth={3} />
                  </Link>
                );
              }
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-colors",
                    active ? "text-[var(--neon)]" : "text-muted-foreground hover:text-foreground",
                  )}
                  aria-label={t.label}
                >
                  <Icon className={cn("w-6 h-6", active && "drop-shadow-[0_0_8px_var(--neon-glow)]")} strokeWidth={active ? 2.5 : 2} />
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
