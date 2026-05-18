import { useState } from "react";
import { Heart, MessageCircle, Repeat2, Coins, Bookmark, Share2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PurpleTick } from "./PurpleTick";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { useWallet, shortAddress } from "@/hooks/use-wallet";
import { sendCusd } from "@/lib/cusd";
import { recordTip } from "@/lib/feed.functions";

export type FeedMeme = {
  id: string;
  creator_wallet: string;
  image_url: string;
  caption: string;
  tags: string[];
  ai_generated: boolean;
  likes_count: number;
  remix_count: number;
  tips_total: number | string;
  created_at: string;
};
export type FeedProfile = {
  wallet_address: string;
  username: string;
  avatar_url: string | null;
  purple_tick: boolean;
  purple_tick_expires_at: string | null;
};

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export function MemeCard({ meme, profile, onTipped }: { meme: FeedMeme; profile?: FeedProfile; onTipped?: () => void }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tipping, setTipping] = useState<number | null>(null);
  const { address } = useWallet();
  const record = useServerFn(recordTip);

  const username = profile?.username ?? "anon";
  const avatar = profile?.avatar_url ?? `https://api.dicebear.com/7.x/thumbs/svg?seed=${meme.creator_wallet}`;
  const verified = !!profile?.purple_tick && (!profile.purple_tick_expires_at || new Date(profile.purple_tick_expires_at) > new Date());

  const tip = async (amount: number) => {
    if (!address) return toast.error("Connect your wallet");
    if (address.toLowerCase() === meme.creator_wallet.toLowerCase()) return toast("Can't tip yourself 😅");
    try {
      setTipping(amount);
      const hash = await sendCusd(address, meme.creator_wallet as `0x${string}`, amount);
      toast("💸 Tip sent", { description: `${amount} cUSD · confirming…` });
      await record({ data: { memeId: meme.id, fromWallet: address, toWallet: meme.creator_wallet as `0x${string}`, amount, txHash: hash } });
      toast.success(`Tipped ${amount} cUSD to @${username}`);
      onTipped?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Tip failed");
    } finally {
      setTipping(null);
    }
  };

  return (
    <article className="rounded-3xl border border-border bg-card overflow-hidden">
      <header className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2.5">
          <img src={avatar} alt="" className="w-10 h-10 rounded-full bg-muted" />
          <div className="leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm">@{username}</span>
              {verified && <PurpleTick size={13} />}
            </div>
            <span className="text-[11px] text-muted-foreground font-mono-chaos">
              {shortAddress(meme.creator_wallet)} · {timeAgo(meme.created_at)}
            </span>
          </div>
        </div>
        {meme.ai_generated && (
          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-[var(--purple-tick)]/15 text-[var(--purple-tick)] border border-[var(--purple-tick)]/40">
            ✨ AI
          </span>
        )}
      </header>

      <div className="relative">
        <img src={meme.image_url} alt={meme.caption} loading="lazy" className="w-full aspect-square object-cover" />
        <div className="absolute right-3 bottom-3 flex flex-col items-center gap-3">
          <button
            onClick={() => setLiked(!liked)}
            className="grid place-items-center w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm active:scale-90 transition-transform"
            aria-label="Like"
          >
            <Heart className={cn("w-6 h-6", liked ? "fill-[var(--hot)] text-[var(--hot)]" : "text-white")} />
          </button>
          <span className="text-xs font-bold text-white drop-shadow">{meme.likes_count}</span>
        </div>
      </div>

      <div className="px-3 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <ActionBtn icon={MessageCircle} label="0" />
          <Link
            to="/remix/$id"
            params={{ id: meme.id }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--purple-tick)]/50 text-[var(--purple-tick)] hover:bg-[var(--purple-tick)]/10 transition-colors"
          >
            <Repeat2 className="w-4 h-4" strokeWidth={2.5} />
            <span className="text-xs font-bold">REMIX · {meme.remix_count}</span>
          </Link>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setSaved(!saved)} className="p-2" aria-label="Save">
            <Bookmark className={cn("w-5 h-5", saved && "fill-[var(--neon)] text-[var(--neon)]")} />
          </button>
          <button className="p-2" aria-label="Share"><Share2 className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="mx-3 mb-3 rounded-2xl bg-background/60 border border-[var(--neon)]/20 p-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-[var(--neon)]" />
          <span className="text-xs font-bold text-[var(--neon)]">{Number(meme.tips_total).toFixed(2)} cUSD</span>
          <span className="text-[10px] text-muted-foreground">tipped</span>
        </div>
        <div className="flex gap-1">
          {[0.01, 0.05, 0.1].map((a) => (
            <button
              key={a}
              onClick={() => tip(a)}
              disabled={tipping !== null}
              className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[var(--neon)] text-background hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 flex items-center gap-1"
            >
              {tipping === a ? <Loader2 className="w-3 h-3 animate-spin" /> : a}
            </button>
          ))}
        </div>
      </div>

      {(meme.caption || meme.tags.length > 0) && (
        <div className="px-4 pb-4 text-sm">
          {meme.caption && (
            <p><span className="font-semibold">@{username}</span> <span className="text-foreground/90">{meme.caption}</span></p>
          )}
          {meme.tags.length > 0 && (
            <p className="mt-1 text-xs text-[var(--neon)] font-medium">{meme.tags.map((t) => (t.startsWith("#") ? t : `#${t}`)).join(" ")}</p>
          )}
        </div>
      )}
    </article>
  );
}

function ActionBtn({ icon: Icon, label }: { icon: typeof Heart; label: string }) {
  return (
    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-muted/50 transition-colors">
      <Icon className="w-4 h-4" />
      <span className="text-xs font-semibold">{label}</span>
    </button>
  );
}
