import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { ArrowLeft, Coins, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { me } from "@/lib/mock-data";

export const Route = createFileRoute("/wallet")({
  component: WalletPage,
  head: () => ({ meta: [{ title: "Wallet · Celovent" }] }),
});

const txs = [
  { id: 1, kind: "in", label: "Tip from @cryptojay", amount: 0.5, ago: "2m" },
  { id: 2, kind: "out", label: "MemeBox · Common", amount: -1, ago: "1h" },
  { id: 3, kind: "in", label: "Remix royalty · m3", amount: 0.25, ago: "3h" },
  { id: 4, kind: "in", label: "Tip from @meme.lord", amount: 0.1, ago: "6h" },
] as const;

function WalletPage() {
  const nav = useNavigate();
  return (
    <MobileShell>
      <header className="sticky top-0 z-40 px-4 py-3 bg-background/90 backdrop-blur-xl border-b border-border flex items-center gap-3">
        <button onClick={() => nav({ to: "/" })} aria-label="Back" className="p-2 -ml-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-display text-xl">WALLET</h1>
      </header>

      <div className="px-4 pt-5 space-y-5">
        <div className="rounded-3xl gradient-celo p-[2px]">
          <div className="rounded-3xl bg-background/90 p-6 text-center">
            <p className="text-xs text-muted-foreground font-mono-chaos uppercase">cUSD balance</p>
            <p className="font-display text-5xl mt-1 text-glow-neon" style={{ color: "var(--neon)" }}>
              {me.balance}
            </p>
            <p className="text-xs text-muted-foreground font-mono-chaos mt-2">{me.wallet} · MiniPay</p>
          </div>
        </div>

        <div>
          <h2 className="font-display text-xl mb-2">RECENT</h2>
          <div className="space-y-2">
            {txs.map((t) => (
              <div key={t.id} className="rounded-2xl bg-card border border-border p-3 flex items-center gap-3">
                <div className={`grid place-items-center w-10 h-10 rounded-full ${t.kind === "in" ? "bg-[var(--neon)]/15 text-[var(--neon)]" : "bg-[var(--hot)]/15 text-[var(--hot)]"}`}>
                  {t.kind === "in" ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{t.label}</p>
                  <p className="text-[11px] text-muted-foreground font-mono-chaos">{t.ago} ago</p>
                </div>
                <p className={`font-bold font-mono-chaos text-sm ${t.kind === "in" ? "text-[var(--neon)]" : "text-[var(--hot)]"}`}>
                  {t.amount > 0 ? "+" : ""}{t.amount}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
          <Coins className="w-4 h-4" /> Crypto stays invisible. We just ship the vibes.
        </div>
      </div>
    </MobileShell>
  );
}
