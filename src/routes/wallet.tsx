import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { ArrowLeft, Coins, ArrowDownLeft, ArrowUpRight, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useWallet, shortAddress } from "@/hooks/use-wallet";
import { useMe } from "@/hooks/use-me";
import { getWalletActivity } from "@/lib/feed.functions";

export const Route = createFileRoute("/wallet")({
  component: WalletPage,
  head: () => ({ meta: [{ title: "Wallet · Celovent" }] }),
});

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

function WalletPage() {
  const nav = useNavigate();
  const { address, isMiniPay } = useWallet();
  const { balance } = useMe();
  const fetchActivity = useServerFn(getWalletActivity);
  const { data, isLoading } = useQuery({
    queryKey: ["wallet-activity", address],
    queryFn: () => fetchActivity({ data: { wallet: address! } }),
    enabled: !!address,
    refetchOnWindowFocus: false,
  });

  return (
    <MobileShell>
      <header className="sticky top-0 z-40 px-4 py-3 bg-background/90 backdrop-blur-xl border-b border-border flex items-center gap-3">
        <button onClick={() => nav({ to: "/" })} aria-label="Back" className="p-2 -ml-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-display text-xl">WALLET</h1>
      </header>

      <div className="px-4 pt-5 space-y-5">
        <div className="rounded-3xl gradient-celo p-[2px]">
          <div className="rounded-3xl bg-background/90 p-6 text-center">
            <p className="text-xs text-muted-foreground font-mono-chaos uppercase">cUSD balance</p>
            <p className="font-display text-5xl mt-1 text-glow-neon" style={{ color: "var(--neon)" }}>
              {balance}
            </p>
            <p className="text-xs text-muted-foreground font-mono-chaos mt-2">
              {address ? shortAddress(address) : "—"} {isMiniPay && "· MiniPay"}
            </p>
          </div>
        </div>

        <div>
          <h2 className="font-display text-xl mb-2">RECENT</h2>
          {isLoading && (
            <div className="grid place-items-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--neon)]" />
            </div>
          )}
          {!isLoading && (data?.txs.length ?? 0) === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No activity yet. Tip a meme to get started.
            </div>
          )}
          <div className="space-y-2">
            {data?.txs.map((t) => (
              <a
                key={t.tx}
                href={`https://celoscan.io/tx/${t.tx}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl bg-card border border-border p-3 flex items-center gap-3"
              >
                <div className={`grid place-items-center w-10 h-10 rounded-full ${t.kind === "in" ? "bg-[var(--neon)]/15 text-[var(--neon)]" : "bg-[var(--hot)]/15 text-[var(--hot)]"}`}>
                  {t.kind === "in" ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{t.label}</p>
                  <p className="text-[11px] text-muted-foreground font-mono-chaos">{timeAgo(t.at)} ago</p>
                </div>
                <p className={`font-bold font-mono-chaos text-sm ${t.kind === "in" ? "text-[var(--neon)]" : "text-[var(--hot)]"}`}>
                  {t.amount > 0 ? "+" : ""}{t.amount.toFixed(2)}
                </p>
              </a>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
          <Coins className="w-4 h-4" /> Gasless tips powered by SendItWithCelo relayer.
        </div>
      </div>
    </MobileShell>
  );
}
