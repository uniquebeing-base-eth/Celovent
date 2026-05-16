import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { TopBar } from "@/components/TopBar";
import { memes } from "@/lib/mock-data";
import { PurpleTick } from "@/components/PurpleTick";
import { Coins, Heart, LogOut, Repeat2, Settings, Sparkles } from "lucide-react";
import { useMe } from "@/hooks/use-me";
import { shortAddress, useWallet } from "@/hooks/use-wallet";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "Profile · Celovent" }] }),
});

function ProfilePage() {
  const myMemes = memes.slice(0, 4);
  const { profile, address, balance } = useMe();
  const { disconnect } = useWallet();
  const username = profile?.username ?? "anon";
  const avatar = profile?.avatar_url ?? `https://api.dicebear.com/7.x/thumbs/svg?seed=${address ?? "anon"}`;
  const purple = profile?.purple_tick ?? false;

  return (
    <MobileShell>
      <TopBar />
      <div className="px-4 pt-4 space-y-5">
        <div className="flex items-start gap-4">
          <img src={avatar} alt="" className="w-20 h-20 rounded-full border-2 border-[var(--neon)] shadow-neon" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl">@{username}</h1>
              {purple && <PurpleTick size={18} />}
            </div>
            <p className="text-xs font-mono-chaos text-muted-foreground">{shortAddress(address)}</p>
            <p className="mt-1 text-sm">{profile?.bio || "making memes, breaking chains 🐸"}</p>
          </div>
          <button aria-label="Disconnect" onClick={disconnect} className="p-2"><LogOut className="w-5 h-5" /></button>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat icon={Heart} value="0" label="likes" />
          <Stat icon={Coins} value={balance} label="cUSD" />
          <Stat icon={Repeat2} value="0" label="remixes" />
        </div>

        {!purple && (
          <Link
            to="/subscribe"
            className="block rounded-3xl gradient-celo p-[2px] active:scale-[0.99] transition-transform"
          >
            <div className="rounded-3xl bg-background/95 px-5 py-4 flex items-center gap-4">
              <div className="grid place-items-center w-12 h-12 rounded-2xl bg-[var(--purple-tick)] animate-shimmer">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-display text-lg text-glow-purple" style={{ color: "var(--purple-tick)" }}>
                  GET THE PURPLE TICK
                </p>
                <p className="text-xs text-muted-foreground">Unlimited AI · creator credibility</p>
              </div>
              <span className="font-display text-2xl">→</span>
            </div>
          </Link>
        )}

        <section>
          <h2 className="font-display text-xl mb-2">MY MEMES</h2>
          <div className="grid grid-cols-3 gap-1.5">
            {myMemes.map((m) => (
              <div key={m.id} className="aspect-square rounded-xl overflow-hidden border border-border">
                <img src={m.image} alt="" loading="lazy" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </MobileShell>
  );
}

function Stat({ icon: Icon, value, label }: { icon: typeof Heart; value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-card border border-border p-3">
      <Icon className="w-4 h-4 mx-auto text-[var(--neon)]" />
      <p className="font-display text-xl mt-1">{value}</p>
      <p className="text-[11px] text-muted-foreground font-mono-chaos uppercase">{label}</p>
    </div>
  );
}
