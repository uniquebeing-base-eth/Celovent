import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { TopBar } from "@/components/TopBar";
import { Search, Flame, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { PurpleTick } from "@/components/PurpleTick";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getExplore } from "@/lib/feed.functions";

export const Route = createFileRoute("/explore")({
  component: ExplorePage,
  head: () => ({ meta: [{ title: "Explore · Celovent" }] }),
});

const filters = ["Trending", "New", "Top"];

function ExplorePage() {
  const [active, setActive] = useState("Trending");
  const [query, setQuery] = useState("");
  const fetchExplore = useServerFn(getExplore);
  const { data, isLoading } = useQuery({
    queryKey: ["explore"],
    queryFn: () => fetchExplore({ data: {} }),
    refetchOnWindowFocus: false,
  });

  const trending = useMemo(() => {
    const list = data?.trending ?? [];
    const q = query.trim().toLowerCase();
    let filtered = q
      ? list.filter(
          (m) =>
            m.caption.toLowerCase().includes(q) ||
            m.tags.some((t) => t.toLowerCase().includes(q)),
        )
      : list;
    if (active === "New") {
      filtered = [...filtered].sort(
        (a, b) => +new Date(b.created_at) - +new Date(a.created_at),
      );
    } else if (active === "Top") {
      filtered = [...filtered].sort((a, b) => Number(b.tips_total) - Number(a.tips_total));
    }
    return filtered;
  }, [data, query, active]);

  return (
    <MobileShell>
      <TopBar />
      <div className="px-4 pt-3 space-y-5">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="search memes & tags..."
            className="w-full rounded-full bg-card border border-border pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-[var(--neon)]"
          />
        </div>

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

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl flex items-center gap-1">
              <Flame className="w-5 h-5 text-[var(--hot)]" /> {active.toUpperCase()} MEMES
            </h2>
          </div>
          {isLoading ? (
            <div className="grid place-items-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--neon)]" />
            </div>
          ) : trending.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No memes match.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {trending.map((m) => (
                <Link
                  key={m.id}
                  to="/remix/$id"
                  params={{ id: m.id }}
                  className="relative aspect-square rounded-2xl overflow-hidden border border-border"
                >
                  <img src={m.image_url} alt={m.caption} loading="lazy" className="w-full h-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <p className="text-[10px] text-[var(--neon)] font-bold">
                      🔥 {m.likes_count} · 💸 {Number(m.tips_total).toFixed(2)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl">TOP CREATORS</h2>
          </div>
          {isLoading ? null : (data?.creators?.length ?? 0) === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No tipped creators yet.
            </div>
          ) : (
            <div className="space-y-2">
              {data!.creators.map((c, i) => (
                <div key={c.wallet} className="flex items-center gap-3 rounded-2xl bg-card border border-border p-3">
                  <span className="font-display text-2xl text-muted-foreground w-6">{i + 1}</span>
                  <img src={c.avatar} alt="" className="w-10 h-10 rounded-full bg-muted" />
                  <div className="flex-1 flex items-center gap-1.5 min-w-0">
                    <span className="font-semibold text-sm truncate">@{c.username}</span>
                    {c.verified && <PurpleTick size={12} />}
                  </div>
                  <span className="text-xs font-bold text-[var(--neon)] font-mono-chaos">
                    {c.tips.toFixed(2)} cUSD
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </MobileShell>
  );
}
