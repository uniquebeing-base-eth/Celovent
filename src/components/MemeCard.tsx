import { useState } from "react";
import { Heart, MessageCircle, Repeat2, Coins, Bookmark, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PurpleTick } from "./PurpleTick";
import { reactions, type Meme } from "@/lib/mock-data";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

export function MemeCard({ meme }: { meme: Meme }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reactBar, setReactBar] = useState(false);

  const tip = (amount: number) => {
    toast(`💸 Tipped ${amount} cUSD to ${meme.creator}`, {
      description: "MiniPay confirmed · animation incoming",
      className: "animate-shake",
    });
  };

  return (
    <article className="rounded-3xl border border-border bg-card overflow-hidden">
      {/* header */}
      <header className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2.5">
          <img src={meme.avatar} alt="" className="w-10 h-10 rounded-full bg-muted" />
          <div className="leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm">{meme.creator}</span>
              {meme.verified && <PurpleTick size={13} />}
            </div>
            <span className="text-[11px] text-muted-foreground font-mono-chaos">
              {meme.wallet} · {meme.ago}
            </span>
          </div>
        </div>
        <button className="text-xs font-bold px-3 py-1.5 rounded-full border border-[var(--neon)] text-[var(--neon)] hover:bg-[var(--neon)] hover:text-background transition-colors">
          Follow
        </button>
      </header>

      {/* image */}
      <div className="relative">
        <img
          src={meme.image}
          alt={meme.caption}
          loading="lazy"
          width={768}
          height={768}
          className="w-full aspect-square object-cover"
        />
        {meme.remixable && (
          <span className="absolute top-3 left-3 text-[10px] font-bold px-2 py-1 rounded-full bg-black/70 text-[var(--neon)] border border-[var(--neon)]/40 backdrop-blur-sm">
            ⚡ REMIXABLE
          </span>
        )}
        <div className="absolute right-3 bottom-3 flex flex-col items-center gap-3">
          <button
            onClick={() => { setLiked(!liked); setReactBar((v) => !v); }}
            className="grid place-items-center w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm active:scale-90 transition-transform"
            aria-label="React"
          >
            <Heart className={cn("w-6 h-6", liked ? "fill-[var(--hot)] text-[var(--hot)]" : "text-white")} />
          </button>
          <span className="text-xs font-bold text-white drop-shadow">{(meme.likes / 1000).toFixed(1)}K</span>
        </div>

        {/* reaction bar */}
        {reactBar && (
          <div className="absolute right-16 bottom-12 flex gap-1 p-1.5 rounded-2xl bg-black/80 backdrop-blur-xl border border-border animate-tilt-bounce">
            {reactions.map((r) => (
              <button
                key={r.label}
                onClick={() => { toast(`${r.emoji} ${r.label.toUpperCase()}`); setReactBar(false); }}
                className="text-2xl hover:scale-125 transition-transform px-1"
                aria-label={r.label}
              >
                {r.emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* actions */}
      <div className="px-3 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <ActionBtn icon={MessageCircle} label={`${meme.comments}`} />
          <Link
            to="/remix/$id"
            params={{ id: meme.id }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--purple-tick)]/50 text-[var(--purple-tick)] hover:bg-[var(--purple-tick)]/10 transition-colors"
          >
            <Repeat2 className="w-4 h-4" strokeWidth={2.5} />
            <span className="text-xs font-bold">REMIX · {meme.remixes}</span>
          </Link>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setSaved(!saved)} className="p-2 hover:scale-110 transition-transform" aria-label="Save">
            <Bookmark className={cn("w-5 h-5", saved && "fill-[var(--neon)] text-[var(--neon)]")} />
          </button>
          <button className="p-2 hover:scale-110 transition-transform" aria-label="Share">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* tip strip */}
      <div className="mx-3 mb-3 rounded-2xl bg-background/60 border border-[var(--neon)]/20 p-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-[var(--neon)]" />
          <span className="text-xs font-bold text-[var(--neon)]">{meme.tips} cUSD</span>
          <span className="text-[10px] text-muted-foreground">tipped</span>
        </div>
        <div className="flex gap-1">
          {[0.01, 0.05, 0.1].map((a) => (
            <button
              key={a}
              onClick={() => tip(a)}
              className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[var(--neon)] text-background hover:scale-105 active:scale-95 transition-transform"
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* caption */}
      <div className="px-4 pb-4 text-sm">
        <p>
          <span className="font-semibold">{meme.creator}</span>{" "}
          <span className="text-foreground/90">{meme.caption}</span>
        </p>
        <p className="mt-1 text-xs text-[var(--neon)] font-medium">
          {meme.tags.join(" ")}
        </p>
      </div>
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
