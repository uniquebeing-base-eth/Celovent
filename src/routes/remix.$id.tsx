import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { ArrowLeft, Type, Smile, Pencil, Crop, Sticker } from "lucide-react";
import { memes } from "@/lib/mock-data";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/remix/$id")({
  component: RemixPage,
  head: () => ({ meta: [{ title: "Remix · Celovent" }] }),
});

const tools = [
  { id: "text", icon: Type, label: "Text" },
  { id: "sticker", icon: Sticker, label: "Sticker" },
  { id: "emoji", icon: Smile, label: "Emoji" },
  { id: "draw", icon: Pencil, label: "Draw" },
  { id: "crop", icon: Crop, label: "Crop" },
];

function RemixPage() {
  const { id } = useParams({ from: "/remix/$id" });
  const nav = useNavigate();
  const meme = memes.find((m) => m.id === id) ?? memes[0];
  const [twist, setTwist] = useState("");
  const [paid, setPaid] = useState(true);

  return (
    <MobileShell>
      <header className="sticky top-0 z-40 px-4 py-3 bg-background/90 backdrop-blur-xl border-b border-border flex items-center gap-3">
        <button onClick={() => nav({ to: "/" })} aria-label="Back" className="p-2 -ml-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="font-display text-xl">REMIX</h1>
          <p className="text-[11px] text-muted-foreground">Original by {meme.creator}</p>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-5">
        <div className="rounded-3xl overflow-hidden border border-border">
          <img src={meme.image} alt={meme.caption} className="w-full aspect-square object-cover" />
        </div>

        <div>
          <label className="text-sm font-semibold text-muted-foreground">Add your twist</label>
          <textarea
            value={twist}
            onChange={(e) => setTwist(e.target.value)}
            placeholder="when you tell your frens about Celo 🚀"
            className="mt-2 w-full rounded-2xl bg-card border border-border p-4 text-base focus:outline-none focus:border-[var(--neon)] resize-none h-20"
          />
        </div>

        <div className="grid grid-cols-5 gap-2">
          {tools.map((t) => (
            <button
              key={t.id}
              className="flex flex-col items-center gap-1 rounded-2xl bg-card border border-border py-3 active:scale-95 transition-transform"
            >
              <t.icon className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase">{t.label}</span>
            </button>
          ))}
        </div>

        <div>
          <h2 className="text-sm font-semibold mb-2">Remix Settings</h2>
          <div className="space-y-2">
            <div className="rounded-2xl bg-card border border-border p-3 flex items-center gap-3">
              <input type="radio" checked={!paid} onChange={() => setPaid(false)} className="accent-[var(--neon)]" />
              <div className="flex-1">
                <p className="font-bold text-sm">Free Remix</p>
                <p className="text-xs text-muted-foreground">Anyone can remix</p>
              </div>
            </div>
            <div className={cn("rounded-2xl border p-3 flex items-center gap-3", paid ? "bg-[var(--neon)]/5 border-[var(--neon)]/40" : "bg-card border-border")}>
              <input type="radio" checked={paid} onChange={() => setPaid(true)} className="accent-[var(--neon)]" />
              <div className="flex-1">
                <p className="font-bold text-sm">Paid Remix</p>
                <p className="text-xs text-muted-foreground">Set a price to remix your meme</p>
              </div>
              <span className="text-xs font-bold text-[var(--neon)] font-mono-chaos">0.5 cUSD</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => { toast("🚀 Remix posted!", { description: "Earning shared with original creator" }); setTimeout(() => nav({ to: "/" }), 800); }}
          className="w-full rounded-2xl bg-[var(--neon)] text-background py-4 font-extrabold shadow-neon active:scale-[0.98] transition-transform"
        >
          POST REMIX 🚀
        </button>
      </div>
    </MobileShell>
  );
}
