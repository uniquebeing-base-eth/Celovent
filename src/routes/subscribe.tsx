import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { ArrowLeft, Sparkles, Check } from "lucide-react";
import { toast } from "sonner";
import { PurpleTick } from "@/components/PurpleTick";

export const Route = createFileRoute("/subscribe")({
  component: SubscribePage,
  head: () => ({ meta: [{ title: "Get Purple Tick · Celovent" }] }),
});

const plans = [
  { id: "daily", name: "Daily Pass", price: 0.5, period: "24 hours", desc: "Try AI for a day" },
  { id: "monthly", name: "Monthly Creator", price: 6, period: "per month", desc: "Unlimited AI · Purple Tick", best: true },
];

const perks = [
  "Unlimited AI meme generation",
  "AI-powered remix variants",
  "Verified Purple Tick badge 🟣",
  "Profile boost in feed",
  "Advanced style transformations",
];

function SubscribePage() {
  const nav = useNavigate();
  return (
    <MobileShell>
      <header className="sticky top-0 z-40 px-4 py-3 bg-background/90 backdrop-blur-xl border-b border-border flex items-center gap-3">
        <button onClick={() => nav({ to: "/profile" })} aria-label="Back" className="p-2 -ml-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-display text-xl">PURPLE TICK</h1>
      </header>

      <div className="px-4 pt-4 space-y-6">
        <div className="text-center pt-4">
          <div className="inline-grid place-items-center w-24 h-24 rounded-full gradient-celo animate-shimmer">
            <PurpleTick size={56} />
          </div>
          <h1 className="font-display text-3xl mt-4 -rotate-1 text-glow-purple" style={{ color: "var(--purple-tick)" }}>
            BECOME A VERIFIED<br />AI CREATOR
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Status. Speed. Unlimited chaos.
          </p>
        </div>

        <div className="space-y-3">
          {plans.map((p) => (
            <button
              key={p.id}
              onClick={() => toast(`✅ Activated ${p.name}`, { description: "MiniPay tx confirmed · Purple Tick incoming" })}
              className={`w-full text-left rounded-3xl p-5 border-2 transition-all active:scale-[0.99] ${
                p.best
                  ? "border-[var(--purple-tick)] bg-gradient-to-br from-[var(--purple-tick)]/15 to-[var(--neon)]/10 shadow-purple"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-2xl">{p.name}</h2>
                    {p.best && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[var(--neon)] text-background">
                        Best value
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.desc}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-3xl text-[var(--neon)] text-glow-neon">${p.price}</p>
                  <p className="text-[10px] text-muted-foreground font-mono-chaos uppercase">{p.period}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="rounded-3xl bg-card border border-border p-5">
          <h3 className="font-display text-xl mb-3">WHAT YOU UNLOCK</h3>
          <ul className="space-y-2.5">
            {perks.map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm">
                <span className="grid place-items-center w-5 h-5 rounded-full bg-[var(--neon)] shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-background" strokeWidth={3} />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-center text-[11px] text-muted-foreground font-mono-chaos pb-2 flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3" /> Paid in cUSD via MiniPay · cancel anytime
        </p>
      </div>
    </MobileShell>
  );
}
