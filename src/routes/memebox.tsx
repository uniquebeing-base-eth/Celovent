import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { TopBar } from "@/components/TopBar";
import { Coins } from "lucide-react";
import memeboxImg from "@/assets/memebox.png";
import { toast } from "sonner";

export const Route = createFileRoute("/memebox")({
  component: MemeBoxPage,
  head: () => ({ meta: [{ title: "MemeBox · Celovent" }] }),
});

const boxes = [
  { id: "common", name: "Common Box", price: 1, color: "from-blue-500 to-cyan-500", emoji: "📦" },
  { id: "rare", name: "Rare Box", price: 5, color: "from-[var(--purple-tick)] to-fuchsia-600", emoji: "🎁" },
  { id: "legendary", name: "Legendary Box", price: 10, color: "from-orange-500 to-[var(--hot)]", emoji: "🏆" },
];

function MemeBoxPage() {
  return (
    <MobileShell>
      <TopBar />
      <div className="px-4 pt-4 space-y-6">
        <div className="text-center">
          <img src={memeboxImg} alt="MemeBox" className="w-56 h-56 mx-auto animate-shimmer" />
          <h1 className="font-display text-3xl mt-2 -rotate-1 text-glow-purple" style={{ color: "var(--purple-tick)" }}>
            OPEN A MEMEBOX
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            unlock exclusive memes, badges, and creator perks
          </p>
        </div>

        <div className="space-y-3">
          {boxes.map((b) => (
            <button
              key={b.id}
              onClick={() => toast(`🎉 Opening ${b.name}...`, { description: "MiniPay confirming · cUSD deducted" })}
              className="w-full flex items-center gap-4 rounded-3xl bg-card border border-border p-4 active:scale-[0.98] transition-transform"
            >
              <div className={`grid place-items-center w-14 h-14 rounded-2xl bg-gradient-to-br ${b.color} text-3xl`}>
                {b.emoji}
              </div>
              <div className="flex-1 text-left">
                <p className="font-bold">{b.name}</p>
                <p className="flex items-center gap-1 text-xs text-[var(--neon)] font-mono-chaos">
                  <Coins className="w-3 h-3" /> {b.price} cUSD
                </p>
              </div>
              <span className="font-display text-xl text-muted-foreground">→</span>
            </button>
          ))}
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-[var(--purple-tick)]/20 to-[var(--neon)]/10 border border-[var(--purple-tick)]/30 p-5">
          <h3 className="font-display text-xl text-glow-purple" style={{ color: "var(--purple-tick)" }}>
            WHAT'S INSIDE?
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>🐸 Rare meme templates</li>
            <li>💎 cUSD tip multipliers</li>
            <li>🟣 Purple Tick day passes</li>
            <li>🎨 Exclusive AI styles</li>
          </ul>
        </div>
      </div>
    </MobileShell>
  );
}
