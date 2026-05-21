import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Wallet, Sparkles } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useWallet, shortAddress } from "@/hooks/use-wallet";
import { claimUsername, getProfile } from "@/lib/profile.functions";
import { signAction } from "@/lib/auth-sig";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/connect")({
  component: ConnectPage,
  head: () => ({ meta: [{ title: "Connect · Celovent" }] }),
});

function ConnectPage() {
  const { address, isConnected, isMiniPay, connecting, connect } = useWallet();
  const navigate = useNavigate();
  const fetchProfile = useServerFn(getProfile);
  const claim = useServerFn(claimUsername);

  const [username, setUsername] = useState("");
  const [step, setStep] = useState<"idle" | "checking" | "claiming">("idle");
  const [alreadyClaimed, setAlreadyClaimed] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;
    setStep("checking");
    (async () => {
      try {
        const { profile } = await fetchProfile({ data: { wallet: address } });
        if (profile?.username) {
          setAlreadyClaimed(profile.username);
          navigate({ to: "/" });
        }
      } catch {
        /* ignore */
      } finally {
        setStep("idle");
      }
    })();
  }, [address, fetchProfile, navigate]);

  async function handleClaim() {
    if (!address) return;
    const clean = username.trim();
    if (!/^[a-zA-Z0-9_.-]{3,24}$/.test(clean)) {
      toast.error("Username must be 3-24 chars: letters, numbers, . _ -");
      return;
    }
    try {
      setStep("claiming");
      toast.message("Sign to claim your handle…", { description: "No gas, just a signature" });
      const sig = await signAction(address, "claim_username");
      await claim({
        data: {
          wallet: address,
          username: clean,
          signature: sig.signature,
          timestamp: sig.timestamp,
          action: "claim_username",
        },
      });
      toast.success(`@${clean} claimed`);
      navigate({ to: "/" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Claim failed";
      toast.error(msg.length > 140 ? "Claim failed" : msg);
    } finally {
      setStep("idle");
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-center">
          <Logo />
        </div>
        <h1 className="font-display text-4xl text-center -rotate-1" style={{ color: "var(--neon)" }}>
          ENTER THE CHAOS
        </h1>

        {!isConnected ? (
          <button
            onClick={connect}
            disabled={connecting}
            className="w-full rounded-2xl bg-foreground text-background font-bold py-4 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
          >
            {connecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wallet className="w-5 h-5" />}
            {isMiniPay ? "Connecting MiniPay…" : "Connect Wallet"}
          </button>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-4 text-center">
              <p className="text-xs text-muted-foreground font-mono-chaos">CONNECTED</p>
              <p className="font-bold mt-1">{shortAddress(address)}</p>
              {isMiniPay && (
                <span className="inline-block mt-1 text-[10px] font-mono-chaos px-2 py-0.5 rounded-full bg-[var(--neon)]/15 text-[var(--neon)]">
                  MINIPAY
                </span>
              )}
            </div>

            {step === "checking" ? (
              <p className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Checking profile…
              </p>
            ) : alreadyClaimed ? (
              <div className="text-center space-y-3">
                <p className="text-sm">
                  Already claimed as <span className="font-bold">@{alreadyClaimed}</span>
                </p>
                <button
                  onClick={() => navigate({ to: "/" })}
                  className="w-full rounded-2xl gradient-celo text-background font-bold py-4"
                >
                  Enter app →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="block">
                  <span className="text-xs font-mono-chaos text-muted-foreground">PICK YOUR HANDLE</span>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="meme.lord"
                    maxLength={24}
                    className="mt-1 w-full rounded-2xl bg-card border border-border px-4 py-3 font-bold focus:outline-none focus:border-[var(--neon)]"
                  />
                </label>
                <button
                  onClick={handleClaim}
                  disabled={step !== "idle" || !username.trim()}
                  className="w-full rounded-2xl gradient-celo text-background font-bold py-4 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {step === "claiming" ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                  {step === "claiming" ? "Claiming…" : "Claim handle"}
                </button>
                <p className="text-[11px] text-muted-foreground font-mono-chaos text-center">
                  free · signature only · no gas required
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
