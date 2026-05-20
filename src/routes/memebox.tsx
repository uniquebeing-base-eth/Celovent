import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { TopBar } from "@/components/TopBar";
import { Coins, Loader2 } from "lucide-react";
import memeboxImg from "@/assets/memebox.png";
import { toast } from "sonner";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useWallet } from "@/hooks/use-wallet";
import { relayPayCusd } from "@/lib/relayer";
import { publicClient } from "@/lib/wallet";
import { TREASURY_ADDRESS } from "@/lib/contracts/registry";
import { openMemeBox } from "@/lib/memebox.functions";

export const Route = createFileRoute("/memebox")({
  component: MemeBoxPage,
  head: () => ({ meta: [{ title: "MemeBox · Celovent" }] }),
});

type BoxId = "common" | "rare" | "legendary";
const boxes: Array<{ id: BoxId; name: string; price: number; color: string; emoji: string }> = [
  { id: "common", name: "Common Box", price: 1, color: "from-blue-500 to-cyan-500", emoji: "📦" },
  { id: "rare", name: "Rare Box", price: 5, color: "from-[var(--purple-tick)] to-fuchsia-600", emoji: "🎁" },
  { id: "legendary", name: "Legendary Box", price: 10, color: "from-orange-500 to-[var(--hot)]", emoji: "🏆" },
];

function MemeBoxPage() {
  const { address } = useWallet();
  const open = useServerFn(openMemeBox);
  const [busy, setBusy] = useState<BoxId | null>(null);

  async function buy(box: BoxId, price: number) {
    if (!address) return toast.error("Connect your wallet");
    try {
      setBusy(box);
      toast.message("Paying…", { description: "Relayer covers gas after approval" });
      const hash = await relayPayCusd({
        from: address,
        to: TREASURY_ADDRESS,
        amount: price,
        interactionType: "memebox",
        message: `box:${box}`,
      });
      await publicClient.waitForTransactionReceipt({ hash }).catch(() => null);
      const res = await open({ data: { wallet: address, box, txHash: hash } });
      toast.success(`${res.reward.emoji} ${res.reward.label}`, { description: "Added to your profile" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Open failed");
    } finally {
      setBusy(null);
    }
  }

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
            unlock AI uses, Purple Tick passes, and rare templates
          </p>
        </div>

        <div className="space-y-3">
          {boxes.map((b) => (
            <button
              key={b.id}
              onClick={() => buy(b.id, b.price)}
              disabled={busy !== null}
              className="w-full flex items-center gap-4 rounded-3xl bg-card border border-border p-4 active:scale-[0.98] transition-transform disabled:opacity-60"
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
              {busy === b.id ? (
                <Loader2 className="w-5 h-5 animate-spin text-[var(--neon)]" />
              ) : (
                <span className="font-display text-xl text-muted-foreground">→</span>
              )}
            </button>
          ))}
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-[var(--purple-tick)]/20 to-[var(--neon)]/10 border border-[var(--purple-tick)]/30 p-5">
          <h3 className="font-display text-xl text-glow-purple" style={{ color: "var(--purple-tick)" }}>
            WHAT'S INSIDE?
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>✨ +AI generations</li>
            <li>🟣 Purple Tick day passes</li>
            <li>🐸 Rare meme templates</li>
            <li>💸 cUSD style credits</li>
          </ul>
        </div>
      </div>
    </MobileShell>
  );
}
