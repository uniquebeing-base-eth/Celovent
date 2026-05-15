import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { TopBar } from "@/components/TopBar";
import { MemeCard } from "@/components/MemeCard";
import { memes } from "@/lib/mock-data";
import { useState } from "react";
import { cn } from "@/lib/utils";

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
                tab === t
                  ? "bg-foreground text-background"
                  : "bg-card text-muted-foreground border border-border",
              )}
            >
              {t === "foryou" ? "For You" : "Following"}
            </button>
          ))}
        </div>

        <h1 className="font-display text-3xl text-glow-neon -rotate-1 mb-3 ml-1" style={{ color: "var(--neon)" }}>
          TODAY'S VIRAL MEMES
        </h1>

        <div className="space-y-5">
          {memes.map((m) => <MemeCard key={m.id} meme={m} />)}
          <div className="text-center py-8 font-mono-chaos text-xs text-muted-foreground">
            ▼ you've reached the bottom of the internet ▼
          </div>
        </div>
      </div>
    </MobileShell>
  );
}
