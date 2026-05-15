import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { TopBar } from "@/components/TopBar";
import { memes, topCreators } from "@/lib/mock-data";
import { Search, Flame } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { PurpleTick } from "@/components/PurpleTick";

export const Route = createFileRoute("/explore")({
  component: ExplorePage,
  head: () => ({ meta: [{ title: "Explore · Celovent" }] }),
});

const filters = ["Trending", "New", "Top", "Collections"];

function ExplorePage() {
  const [active, setActive] = useState("Trending");
  return (
    <MobileShell>
      <TopBar />
      <div className="px-4 pt-3 space-y-5">
        {/* search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            placeholder="search memes, creators, tags..."
            className="w-full rounded-full bg-card border border-border pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-[var(--neon)]"
          />
        </div>

        {/* filters */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActive(f)}
              className={cn(
                "shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all",
                active === f
                  ? "bg-[var(--neon)] text-background"
                  : "bg-card border border-border text-muted-foreground",
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* trending */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl flex items-center gap-1">
              <Flame className="w-5 h-5 text-[var(--hot)]" /> TRENDING MEMES
            </h2>
            <span className="text-xs text-[var(--neon)] font-bold">See all</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {memes.map((m) => (
              <div key={m.id} className="relative aspect-square rounded-2xl overflow-hidden border border-border group">
                <img src={m.image} alt={m.caption} loading="lazy" className="w-full h-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <p className="text-[10px] font-mono-chaos text-white/90 truncate">{m.creator}</p>
                  <p className="text-[10px] text-[var(--neon)] font-bold">🔥 {(m.likes / 1000).toFixed(1)}K</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* top creators */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl">TOP CREATORS</h2>
            <span className="text-xs text-[var(--neon)] font-bold">See all</span>
          </div>
          <div className="space-y-2">
            {topCreators.map((c, i) => (
              <div key={c.name} className="flex items-center gap-3 rounded-2xl bg-card border border-border p-3">
                <span className="font-display text-2xl text-muted-foreground w-6">{i + 1}</span>
                <img src={c.avatar} alt="" className="w-10 h-10 rounded-full bg-muted" />
                <div className="flex-1 flex items-center gap-1.5">
                  <span className="font-semibold text-sm">{c.name}</span>
                  {c.verified && <PurpleTick size={12} />}
                </div>
                <span className="text-xs font-bold text-[var(--neon)] font-mono-chaos">{c.tips} tips</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </MobileShell>
  );
}
