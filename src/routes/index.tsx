import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { TopBar } from "@/components/TopBar";
import { MemeCard, type FeedMeme, type FeedProfile } from "@/components/MemeCard";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getFeed } from "@/lib/feed.functions";
import { Loader2, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useWallet } from "@/hooks/use-wallet";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Celovent — Create. Remix. Earn." },
      { name: "description", content: "MiniPay-native meme remix social network on Celo. Tip in cUSD, remix with AI, earn the purple tick." },
    ],
  }),
});

function Index() {
  const [tab, setTab] = useState<"foryou" | "following">("foryou");
  const fetchFeed = useServerFn(getFeed);
  const { address } = useWallet();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["feed", tab, address ?? null],
    queryFn: () =>
      fetchFeed({
        data: tab === "following" && address ? { limit: 30, follower: address } : { limit: 30 },
      }),
    refetchOnWindowFocus: false,
  });

  const profileMap = new Map<string, FeedProfile>(
    (data?.profiles ?? []).map((p) => [p.wallet_address.toLowerCase(), p as FeedProfile]),
  );

  return (
    <MobileShell>
      <TopBar />
      <div className="px-4 pt-3">
        <div className="flex items-center justify-between gap-2 mb-3">
          {(["foryou", "following"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 py-2.5 rounded-2xl font-bold text-sm transition-all",
                tab === t ? "bg-foreground text-background" : "bg-card text-muted-foreground border border-border",
              )}
            >
              {t === "foryou" ? "For You" : "Following"}
            </button>
          ))}
        </div>

        <h1 className="font-display text-3xl text-glow-neon -rotate-1 mb-3 ml-1" style={{ color: "var(--neon)" }}>
          TODAY'S VIRAL MEMES
        </h1>

        {isLoading && (
          <div className="grid place-items-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--neon)]" />
          </div>
        )}

        {!isLoading && (data?.memes.length ?? 0) === 0 && (
          <div className="rounded-3xl border border-border bg-card p-8 text-center">
            <Sparkles className="w-10 h-10 text-[var(--neon)] mx-auto mb-3" />
            <p className="font-display text-xl">No memes yet</p>
            <p className="text-sm text-muted-foreground mt-1">Be the first to drop one.</p>
            <Link to="/create" className="inline-block mt-4 px-5 py-2.5 rounded-full bg-[var(--neon)] text-background font-extrabold text-sm shadow-neon">
              Create a meme ✨
            </Link>
          </div>
        )}

        <div className="space-y-5">
          {(data?.memes as FeedMeme[] | undefined)?.map((m) => (
            <MemeCard key={m.id} meme={m} profile={profileMap.get(m.creator_wallet.toLowerCase())} onTipped={() => refetch()} />
          ))}
          {(data?.memes.length ?? 0) > 0 && (
            <div className="text-center py-8 font-mono-chaos text-xs text-muted-foreground">
              ▼ you've reached the bottom of the internet ▼
            </div>
          )}
        </div>
      </div>
    </MobileShell>
  );
}
