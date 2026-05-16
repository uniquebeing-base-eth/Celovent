import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Wallet, Sparkles } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { writeContract, waitForTransactionReceipt, readContract } from "viem/actions";
import { celo } from "viem/chains";
import { useWallet, shortAddress } from "@/hooks/use-wallet";
import { getWalletClient, publicClient } from "@/lib/wallet";
import { REGISTRY_ABI, REGISTRY_ADDRESS } from "@/lib/contracts/registry";
import { createProfile, getProfile } from "@/lib/profile.functions";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/connect")({
  component: ConnectPage,
  head: () => ({ meta: [{ title: "Connect · Celovent" }] }),
});

function ConnectPage() {
  const { address, isConnected, isMiniPay, connecting, connect } = useWallet();
  const navigate = useNavigate();
  const fetchProfile = useServerFn(getProfile);
  const saveProfile = useServerFn(createProfile);

  const [username, setUsername] = useState("");
  const [step, setStep] = useState<"idle" | "checking" | "tx" | "saving">("idle");
  const [onChainName, setOnChainName] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;
    if (!REGISTRY_ADDRESS) return;
    setStep("checking");
    (async () => {
      try {
        const name = (await readContract(publicClient, {
          address: REGISTRY_ADDRESS,
          abi: REGISTRY_ABI,
          functionName: "usernames",
          args: [address],
        })) as string;
        setOnChainName(name || null);
        if (name) {
          // Already registered on-chain — make sure DB row exists, then go home
          const { profile } = await fetchProfile({ data: { wallet: address } });
          if (profile) {
            navigate({ to: "/" });
            return;
          }
        }
      } finally {
        setStep("idle");
      }
    })();
  }, [address, fetchProfile, navigate]);

  async function handleRegister() {
    if (!address) return;
    if (!REGISTRY_ADDRESS) {
      toast.error("Registry contract not configured. Deploy CeloventRegistry.sol and set VITE_CELOVENT_REGISTRY_ADDRESS.");
      return;
    }
    const wc = getWalletClient();
    if (!wc) {
      toast.error("No wallet detected");
      return;
    }
    const clean = username.trim();
    if (!/^[a-zA-Z0-9_.-]{3,24}$/.test(clean)) {
      toast.error("Username must be 3-24 chars: letters, numbers, . _ -");
      return;
    }

    try {
      setStep("tx");
      toast.message("Confirm in your wallet…");
      const hash = await writeContract(wc, {
        account: address,
        chain: celo,
        address: REGISTRY_ADDRESS,
        abi: REGISTRY_ABI,
        functionName: "registerUser",
        args: [clean],
      });
      toast.message("Waiting for confirmation…");
      await waitForTransactionReceipt(publicClient, { hash });

      setStep("saving");
      const message = `Celovent profile creation\nWallet: ${address}\nUsername: ${clean}\nTx: ${hash}`;
      const signature = (await wc.signMessage({ account: address, message })) as `0x${string}`;
      await saveProfile({
        data: { wallet: address, username: clean, signature, message, txHash: hash },
      });
      toast.success(`@${clean} claimed on-chain`);
      navigate({ to: "/" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Registration failed";
      toast.error(msg.length > 140 ? "Registration failed" : msg);
    } finally {
      setStep("idle");
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-center"><Logo /></div>
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
                <Loader2 className="w-4 h-4 animate-spin" /> Checking registration…
              </p>
            ) : onChainName ? (
              <div className="text-center space-y-3">
                <p className="text-sm">Already registered as <span className="font-bold">@{onChainName}</span></p>
                <button onClick={() => navigate({ to: "/" })} className="w-full rounded-2xl gradient-celo text-background font-bold py-4">
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
                  onClick={handleRegister}
                  disabled={step !== "idle" || !username.trim()}
                  className="w-full rounded-2xl gradient-celo text-background font-bold py-4 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {step === "tx" && <Loader2 className="w-5 h-5 animate-spin" />}
                  {step === "saving" && <Loader2 className="w-5 h-5 animate-spin" />}
                  {step === "idle" && <Sparkles className="w-5 h-5" />}
                  {step === "tx" ? "Signing tx…" : step === "saving" ? "Creating profile…" : "Claim on-chain"}
                </button>
                <p className="text-[11px] text-muted-foreground font-mono-chaos text-center">
                  one-time · ~$0.01 cUSD gas · stored on Celo mainnet
                </p>
              </div>
            )}
          </div>
        )}

        {!REGISTRY_ADDRESS && (
          <div className="rounded-xl border border-[var(--hot)]/40 bg-[var(--hot)]/10 p-3 text-xs">
            <strong>Setup required:</strong> deploy <code>contracts/CeloventRegistry.sol</code> and set
            <code className="mx-1">VITE_CELOVENT_REGISTRY_ADDRESS</code>. See <code>contracts/DEPLOY.md</code>.
          </div>
        )}
      </div>
    </div>
  );
}
