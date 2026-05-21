import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { ArrowLeft, Coins, Sparkles, Image as ImageIcon, Wand2, Loader2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useWallet } from "@/hooks/use-wallet";
import { useServerFn } from "@tanstack/react-start";
import { generateMeme, getAiQuota, uploadMemeImage } from "@/lib/ai.functions";
import { postMeme } from "@/lib/feed.functions";
import { signAction } from "@/lib/auth-sig";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMe } from "@/hooks/use-me";

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

type Mode = "ai" | "upload";

function CreatePage() {
  const nav = useNavigate();
  const { address } = useWallet();
  const { balance } = useMe();
  const qc = useQueryClient();
  const gen = useServerFn(generateMeme);
  const upload = useServerFn(uploadMemeImage);
  const post = useServerFn(postMeme);
  const quotaFn = useServerFn(getAiQuota);
  const fileRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>("ai");
  const [text, setText] = useState("");
  const [style, setStyle] = useState("auto");
  const [generating, setGenerating] = useState(false);
  const [posting, setPosting] = useState(false);
  const [generated, setGenerated] = useState<string | null>(null);

  const { data: quota, refetch: refetchQuota } = useQuery({
    queryKey: ["ai-quota", address],
    queryFn: () => quotaFn({ data: { wallet: address! } }),
    enabled: !!address && mode === "ai",
  });
  const usesLeft = typeof quota?.remaining === "number" ? quota.remaining : 2;
  const purple = quota?.purpleTick ?? false;

  useEffect(() => {
    return () => {
      if (selectedPreview) URL.revokeObjectURL(selectedPreview);
    };
  }, [selectedPreview]);

  const generate = async () => {
    if (!address) return toast.error("Connect your wallet");
    if (!text.trim()) return toast("Type something first 👀");
    if (!purple && usesLeft <= 0) {
      toast.error("Out of free AI uses", { description: "Get the Purple Tick for unlimited generations" });
      return;
    }
    try {
      setGenerating(true);
      setGenerated(null);
      const sig = await signAction(address, "ai_generate");
      const res = await gen({ data: { wallet: address, prompt: text, style, signature: sig.signature, timestamp: sig.timestamp, action: "ai_generate" } });
      setGenerated(res.imageUrl);
      refetchQuota();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const publish = async () => {
    if (!address || !image) return;
    try {
      setPosting(true);
      const sig = await signAction(address, "post_meme");
      await post({ data: {
        wallet: address,
        imageUrl: generated,
        caption: text,
        tags: [],
        aiGenerated: true,
        signature: sig.signature, timestamp: sig.timestamp, action: "post_meme",
      } });
      toast.success("Posted! 🚀");
      qc.invalidateQueries({ queryKey: ["feed"] });
      nav({ to: "/" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Post failed");
    } finally {
      setPosting(false);
    }
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
          <span className="text-xs font-bold font-mono-chaos">{balance}</span>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-5">
        {/* Mode toggle */}
        <div className="flex gap-2 rounded-2xl bg-card border border-border p-1">
          <button
            onClick={() => {
              setMode("ai");
              setImage(null);
              setUploaded(false);
            }}
            className={cn(
              "flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition-all",
              mode === "ai" ? "bg-[var(--neon)] text-background shadow-neon" : "text-muted-foreground",
            )}
          >
            <Wand2 className="w-4 h-4" /> Generate with AI
          </button>
          <button
            onClick={() => {
              setMode("upload");
              setImage(null);
              setUploaded(false);
            }}
            className={cn(
              "flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition-all",
              mode === "upload" ? "bg-foreground text-background" : "text-muted-foreground",
            )}
          >
            <Upload className="w-4 h-4" /> Upload meme
          </button>
        </div>

        <div>
          <label className="text-sm font-semibold text-muted-foreground">
            {mode === "ai" ? "What's on your mind?" : "Caption"}
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 200))}
            placeholder={mode === "ai" ? "when you finally understand crypto..." : "drop a caption (optional)"}
            className="mt-2 w-full rounded-2xl bg-card border border-border p-4 text-base focus:outline-none focus:border-[var(--neon)] resize-none h-24"
          />
          <div className="text-right text-[11px] text-muted-foreground font-mono-chaos">{text.length}/200</div>
        </div>

        <div>
          <h2 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
            <Sparkles className="w-4 h-4 text-[var(--purple-tick)]" /> AI Style
          </h2>
          <div className="grid grid-cols-4 gap-2">
            {styles.slice(0, 4).map((s) => (
              <button
                key={s.id}
                onClick={() => setStyle(s.id)}
                className={cn(
                  "rounded-2xl aspect-square grid place-items-center text-3xl transition-all",
                  style === s.id ? "bg-[var(--neon)] text-background shadow-neon scale-105" : "bg-card border border-border",
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

        <div>
          <h2 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
            {mode === "ai" ? (
              <>
                <Wand2 className="w-4 h-4 text-[var(--neon)]" /> AI Generated
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 text-[var(--neon)]" /> Your image
              </>
            )}
          </h2>
          <div
            onClick={mode === "upload" && !image && !generating ? pickFile : undefined}
            className={cn(
              "rounded-2xl bg-card border border-border aspect-square grid place-items-center overflow-hidden",
              mode === "upload" && !image && !generating && "cursor-pointer hover:border-[var(--neon)]",
            )}
          >
            {generating ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--neon)]" />
                <span className="font-mono-chaos text-xs">
                  {mode === "ai" ? "cooking your meme..." : "uploading..."}
                </span>
              </div>
            ) : image ? (
              <img src={image} alt="Meme" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center text-muted-foreground p-6">
                {mode === "ai" ? (
                  <>
                    <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Your AI meme appears here</p>
                    <p className="text-[11px] mt-1 font-mono-chaos">
                      {purple ? "unlimited ✨" : `${usesLeft} free uses left`}
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="w-12 h-12 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Tap to choose a meme</p>
                    <p className="text-[11px] mt-1 font-mono-chaos">PNG · JPG · GIF · WEBP · max 8MB</p>
                    <p className="text-[10px] mt-2 text-muted-foreground/70">
                      uploads are tagged 📷 — no tipping or remix
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 pb-4">
          {mode === "ai" ? (
            <button
              onClick={generate}
              disabled={generating || posting}
              className="rounded-2xl bg-card border border-border py-3.5 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Wand2 className="w-4 h-4" /> {image ? "Regenerate" : "Generate"}
            </button>
          ) : (
            <button
              onClick={pickFile}
              disabled={generating || posting}
              className="rounded-2xl bg-card border border-border py-3.5 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" /> {image ? "Change" : "Choose"}
            </button>
          )}
          <button
            onClick={image ? publish : mode === "ai" ? generate : pickFile}
            disabled={generating || posting || (mode === "ai" && !image && !text.trim())}
            className="rounded-2xl bg-[var(--neon)] text-background py-3.5 font-extrabold text-sm shadow-neon disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {posting && <Loader2 className="w-4 h-4 animate-spin" />}
            {image ? "Post 🚀" : mode === "ai" ? "Generate ✨" : "Upload 📤"}
          </button>
        </div>

        {mode === "ai" && !purple && usesLeft <= 0 && (
          <div className="rounded-2xl bg-gradient-to-br from-[var(--purple-tick)]/20 to-[var(--neon)]/10 border border-[var(--purple-tick)]/40 p-4">
            <p
              className="font-display text-lg text-glow-purple mb-1"
              style={{ color: "var(--purple-tick)" }}
            >
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
