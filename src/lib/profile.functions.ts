import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createPublicClient, http, isAddress, getAddress } from "viem";
import { celo } from "viem/chains";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const publicClient = createPublicClient({ chain: celo, transport: http("https://forno.celo.org") });
const DEPLOYED_REGISTRY_ADDRESS = "0x86164d52CA338f2ce0bA9218135AF3a1E26E1063" as const;

const ADDRESS = z.string().refine(isAddress, "Invalid address").transform((v) => getAddress(v));
const REGISTRY_READ_ABI = [
  {
    type: "function",
    name: "usernames",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "string" }],
  },
] as const;

export const getProfile = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ wallet: ADDRESS }).parse(input))
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("wallet_address", data.wallet.toLowerCase())
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { profile: row };
  });

export const createProfile = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        wallet: ADDRESS,
        username: z.string().min(3).max(24).regex(/^[a-zA-Z0-9_.-]+$/, "Invalid username"),
        txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
        avatarUrl: z.string().url().optional(),
        bio: z.string().max(280).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const registryAddress = (process.env.VITE_CELOVENT_REGISTRY_ADDRESS || DEPLOYED_REGISTRY_ADDRESS) as
      | `0x${string}`
      | undefined;
    if (!registryAddress || !isAddress(registryAddress)) throw new Error("Registry contract not configured");

    // 1. Confirm the registration tx succeeded on Celo, was sent by this wallet, and targeted our registry.
    const tx = await publicClient.getTransaction({ hash: data.txHash as `0x${string}` }).catch(() => null);
    if (!tx) throw new Error("Transaction not found on Celo");
    if (tx.from.toLowerCase() !== data.wallet.toLowerCase()) {
      throw new Error("Transaction sender mismatch");
    }
    if (tx.to?.toLowerCase() !== registryAddress.toLowerCase()) {
      throw new Error("Transaction registry mismatch");
    }

    const receipt = await publicClient.getTransactionReceipt({ hash: data.txHash as `0x${string}` }).catch(() => null);
    if (!receipt || receipt.status !== "success") throw new Error("Registration transaction was not confirmed");

    const onChainUsername = (await publicClient.readContract({
      address: registryAddress,
      abi: REGISTRY_READ_ABI,
      functionName: "usernames",
      args: [data.wallet],
    })) as string;
    if (onChainUsername.toLowerCase() !== data.username.toLowerCase()) {
      throw new Error("On-chain username mismatch");
    }

    // 2. Upsert profile (wallet stored lowercased)
    const walletLower = data.wallet.toLowerCase();
    const { data: row, error } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          wallet_address: walletLower,
          username: data.username,
          avatar_url:
            data.avatarUrl ??
            `https://api.dicebear.com/7.x/thumbs/svg?seed=${walletLower}&backgroundColor=a1ff3d,b794f6,fb7185,facc15`,
          bio: data.bio ?? "",
          tx_hash: data.txHash,
        },
        { onConflict: "wallet_address" },
      )
      .select()
      .single();
    if (error) {
      if (error.code === "23505") throw new Error("Username already taken");
      throw new Error(error.message);
    }
    return { profile: row };
  });
