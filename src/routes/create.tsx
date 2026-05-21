import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { ArrowLeft, Coins, Sparkles, Image as ImageIcon, Wand2, Loader2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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

function CreatePage() {
  const nav = useNavigate();
  const { address } = useWallet();
  const { balance } = useMe();
  const qc = useQueryClient();
  const gen = useServerFn(generateMeme);
  const upload = useServerFn(uploadMemeImage);
  const post = useServerFn(postMeme);
  const quotaFn = useServerFn(getAiQuota);

  const [text, setText] = useState("");
  const [style, setStyle] = useState("auto");
  const [generating, setGenerating] = useState(false);
  const [posting, setPosting] = useState(false);
  const [generated, setGenerated] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [manualUploadReady, setManualUploadReady] = useState(false);

  const { data: quota, refetch: refetchQuota } = useQuery({
    queryKey: ["ai-quota", address],
    queryFn: () => quotaFn({ data: { wallet: address! } }),
    enabled: !!address,
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
      setManualUploadReady(false);
      const sig = await signAction(address, "ai_generate");
      const res = await gen({ data: { wallet: address, prompt: text, style, signature: sig.signature, timestamp: sig.timestamp, action: "ai_generate" } });
      setGenerated(res.imageUrl);
      setSelectedFile(null);
      setSelectedPreview(null);
      refetchQuota();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const uploadImage = async () => {
    if (!address) return toast.error("Connect your wallet");
    if (!selectedFile) return toast.error("Pick an image first");
    try {
      setUploading(true);
      const sig = await signAction(address, "upload_meme");
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Unable to read file"));
        reader.readAsDataURL(selectedFile);
      });
      const res = await uploadMemeImage({ data: { wallet: address, dataUrl, signature: sig.signature, timestamp: sig.timestamp, action: "upload_meme" } });
      setGenerated(res.imageUrl);
      setSelectedFile(null);
      setSelectedPreview(null);
      setManualUploadReady(true);
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.success("Uploaded! Ready to post.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const publish = async () => {
    if (!address || !generated) return;
    try {
      setPosting(true);
      const sig = await signAction(address, "post_meme");
      await post({ data: {
        wallet: address,
        imageUrl: generated,
        caption: text,
        tags: [],
        aiGenerated: !manualUploadReady,
        manualUpload: manualUploadReady,
        signature: sig.signature,
        timestamp: sig.timestamp,
        action: "post_meme",
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
        <div>
          <label className="text-sm font-semibold text-muted-foreground">What's on your mind?</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 200))}
            placeholder="when you finally understand crypto..."
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

        <div className="rounded-3xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Upload className="w-4 h-4 text-[var(--neon)]" />
            Upload your own meme
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="w-full rounded-2xl border border-border bg-background p-3 text-sm file:cursor-pointer file:border-0 file:bg-[var(--neon)] file:px-3 file:py-2 file:text-background file:font-semibold"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setSelectedFile(file);
              setManualUploadReady(false);
              if (file) {
                if (!file.type.startsWith("image/")) {
                  toast.error("Please select an image file");
                  setSelectedFile(null);
                  setSelectedPreview(null);
                  return;
                }
                if (file.size > 8 * 1024 * 1024) {
                  toast.error("Image must be under 8MB");
                  setSelectedFile(null);
                  setSelectedPreview(null);
                  return;
                }
                setSelectedPreview(URL.createObjectURL(file));
              } else {
                setSelectedPreview(null);
              }
            }}
          />
          {selectedPreview && (
            <div className="rounded-2xl overflow-hidden border border-border">
              <img src={selectedPreview} alt="Selected" className="w-full object-cover" />
            </div>
          )}
          <button
            type="button"
            onClick={uploadImage}
            disabled={!selectedFile || uploading}
            className="w-full rounded-2xl bg-[var(--neon)] text-background py-3.5 font-extrabold text-sm shadow-neon disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "Upload Image"}
          </button>
        </div>

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
                <p className="text-[11px] mt-1 font-mono-chaos">{purple ? "unlimited ✨" : `${usesLeft} free uses left`}</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pb-4">
          <button
            onClick={generate}
            disabled={generating || posting}
            className="rounded-2xl bg-card border border-border py-3.5 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Wand2 className="w-4 h-4" /> {generated ? "Regenerate" : "Generate"}
          </button>
          <button
            onClick={generated ? publish : generate}
            disabled={generating || posting || (!generated && !text.trim())}
            className="rounded-2xl bg-[var(--neon)] text-background py-3.5 font-extrabold text-sm shadow-neon disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {posting && <Loader2 className="w-4 h-4 animate-spin" />}
            {generated ? "Post 🚀" : "Generate ✨"}
          </button>
        </div>

        {!purple && usesLeft <= 0 && (
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
