import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useWallet } from "@/hooks/use-wallet";
import { getMeme, postMeme } from "@/lib/feed.functions";
import { signAction } from "@/lib/auth-sig";

export const Route = createFileRoute("/remix/$id")({
  component: RemixPage,
  head: () => ({ meta: [{ title: "Remix · Celovent" }] }),
});

function RemixPage() {
  const { id } = useParams({ from: "/remix/$id" });
  const nav = useNavigate();
  const { address } = useWallet();
  const fetchMeme = useServerFn(getMeme);
  const savePost = useServerFn(postMeme);

  const { data, isLoading } = useQuery({
    queryKey: ["meme", id],
    queryFn: () => fetchMeme({ data: { id } }),
    refetchOnWindowFocus: false,
  });
  const [twist, setTwist] = useState("");
  const [posting, setPosting] = useState(false);

  const meme = data?.meme;
  const profile = data?.profile;

  async function publish() {
    if (!address) return toast.error("Connect your wallet");
    if (!meme) return;
    if (!twist.trim()) return toast.error("Add a caption");
    try {
      setPosting(true);
      const sig = await signAction(address, "post_meme");
      await savePost({
        data: {
          wallet: address,
          imageUrl: meme.image_url,
          caption: twist.trim(),
          tags: meme.tags,
          parentId: meme.id,
          aiGenerated: false,
          manualUpload: false,
          signature: sig.signature,
          timestamp: sig.timestamp,
          action: "post_meme",
        },
      });
      toast.success("Remix posted 🚀");
      setTimeout(() => nav({ to: "/" }), 600);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to post remix");
    } finally {
      setPosting(false);
    }
  }

  return (
    <MobileShell>
      <header className="sticky top-0 z-40 px-4 py-3 bg-background/90 backdrop-blur-xl border-b border-border flex items-center gap-3">
        <button onClick={() => nav({ to: "/" })} aria-label="Back" className="p-2 -ml-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="font-display text-xl">REMIX</h1>
          <p className="text-[11px] text-muted-foreground">
            {profile ? `Original by @${profile.username}` : "Loading…"}
          </p>
        </div>
      </header>

      {isLoading || !meme ? (
        <div className="grid place-items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--neon)]" />
        </div>
      ) : meme.allow_remixing === false ? (
        <div className="px-4 pt-8 text-center space-y-3">
          <p className="font-display text-2xl">Remixing disabled</p>
          <p className="text-sm text-muted-foreground">This meme is upload-only.</p>
          <button onClick={() => nav({ to: "/" })} className="mt-2 px-5 py-2.5 rounded-full bg-card border border-border text-sm">
            Back home
          </button>
        </div>
      ) : (
        <div className="px-4 pt-4 space-y-5">
          <div className="rounded-3xl overflow-hidden border border-border">
            <img src={meme.image_url} alt={meme.caption} className="w-full aspect-square object-cover" />
          </div>

          <div>
            <label className="text-sm font-semibold text-muted-foreground">Add your twist</label>
            <textarea
              value={twist}
              onChange={(e) => setTwist(e.target.value)}
              placeholder="when you tell your frens about Celo 🚀"
              maxLength={280}
              className="mt-2 w-full rounded-2xl bg-card border border-border p-4 text-base focus:outline-none focus:border-[var(--neon)] resize-none h-24"
            />
          </div>

          <button
            onClick={publish}
            disabled={posting || !twist.trim()}
            className="w-full rounded-2xl bg-[var(--neon)] text-background py-4 font-extrabold shadow-neon active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {posting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            POST REMIX 🚀
          </button>
        </div>
      )}
    </MobileShell>
  );
}
