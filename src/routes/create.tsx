import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { ArrowLeft, Coins, Sparkles, Image as ImageIcon, Wand2, Loader2 } from "lucide-react";
import { useState } from "react";
import { me } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/create")({
  component: CreatePage,
  head: () => ({ meta: [{ title: "Create Meme · Celovent" }] }),
});

const styles = [
  { id: "auto", label: "Auto", emoji: "✨" },
  { id: "anime", label: "Anime", emoji: "🌸" },
  { id: "3d", label: "3D Cartoon", emoji: "🎨" },
  { id: "wojak", label: "Wojak", emoji: "😐" },
  { id: "pepe", label: "Pepe", emoji: "🐸" },
  { id: "pixel", label: "Pixel", emoji: "👾" },
];

function CreatePage() {
  const nav = useNavigate();
  const [text, setText] = useState("");
  const [style, setStyle] = useState("auto");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<string | null>(null);
  const usesLeft = me.aiUsesLeft;

  const generate = async () => {
    if (!text.trim()) return toast("Type something first 👀");
    setGenerating(true);
    setGenerated(null);
    setTimeout(() => {
      setGenerated(`https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(text + style)}&backgroundColor=a1ff3d,b794f6`);
      setGenerating(false);
    }, 1400);
  };

  return (
    <MobileShell>
      <header className="sticky top-0 z-40 px-4 py-3 bg-background/90 backdrop-blur-xl border-b border-border flex items-center justify-between">
        <button onClick={() => nav({ to: "/" })} aria-label="Back" className="p-2 -ml-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-display text-xl tracking-wider">CREATE MEME</h1>
        <div className="flex items-center gap-1.5 rounded-full border border-[var(--neon)]/40 bg-[var(--neon)]/5 px-2.5 py-1">
          <Coins className="w-3.5 h-3.5 text-[var(--neon)]" />
          <span className="text-xs font-bold font-mono-chaos">{me.balance}</span>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-5">
        {/* prompt */}
        <div>
          <label className="text-sm font-semibold text-muted-foreground">What's on your mind?</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 100))}
            placeholder="when you finally understand crypto..."
            className="mt-2 w-full rounded-2xl bg-card border border-border p-4 text-base focus:outline-none focus:border-[var(--neon)] resize-none h-24"
          />
          <div className="text-right text-[11px] text-muted-foreground font-mono-chaos">{text.length}/100</div>
        </div>

        {/* AI Style */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[var(--purple-tick)]" /> AI Style
            </h2>
            <span className="text-xs text-muted-foreground">See all</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {styles.slice(0, 4).map((s) => (
              <button
                key={s.id}
                onClick={() => setStyle(s.id)}
                className={cn(
                  "rounded-2xl aspect-square grid place-items-center text-3xl transition-all",
                  style === s.id
                    ? "bg-[var(--neon)] text-background shadow-neon scale-105"
                    : "bg-card border border-border",
                )}
              >
                <div className="text-center">
                  <div>{s.emoji}</div>
                  <div className="text-[10px] font-bold mt-1">{s.label}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* AI Generated */}
        <div>
          <h2 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
            <Wand2 className="w-4 h-4 text-[var(--neon)]" /> AI Generated
          </h2>
          <div className="rounded-2xl bg-card border border-border aspect-square grid place-items-center overflow-hidden">
            {generating ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--neon)]" />
                <span className="font-mono-chaos text-xs">cooking your meme...</span>
              </div>
            ) : generated ? (
              <img src={generated} alt="Generated meme" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center text-muted-foreground p-6">
                <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Your AI meme appears here</p>
                <p className="text-[11px] mt-1 font-mono-chaos">{usesLeft} free uses left</p>
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="grid grid-cols-2 gap-3 pb-4">
          <button
            onClick={generate}
            disabled={generating}
            className="rounded-2xl bg-card border border-border py-3.5 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Wand2 className="w-4 h-4" /> Regenerate
          </button>
          <button
            onClick={generate}
            disabled={generating || !text.trim()}
            className="rounded-2xl bg-[var(--neon)] text-background py-3.5 font-extrabold text-sm shadow-neon disabled:opacity-50"
          >
            {generated ? "Continue →" : "Generate ✨"}
          </button>
        </div>

        {!generated && usesLeft <= 0 && (
          <div className="rounded-2xl bg-gradient-to-br from-[var(--purple-tick)]/20 to-[var(--neon)]/10 border border-[var(--purple-tick)]/40 p-4">
            <p className="font-display text-lg text-glow-purple mb-1" style={{ color: "var(--purple-tick)" }}>
              UNLOCK THE PURPLE TICK 🟣
            </p>
            <p className="text-sm text-muted-foreground">
              Out of free AI uses. Subscribe to generate unlimited memes & become a verified creator.
            </p>
          </div>
        )}
      </div>
    </MobileShell>
  );
}
