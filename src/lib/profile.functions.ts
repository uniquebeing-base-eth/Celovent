import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createPublicClient, http, verifyMessage, isAddress, getAddress } from "viem";
import { celo } from "viem/chains";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const publicClient = createPublicClient({ chain: celo, transport: http("https://forno.celo.org") });

const ADDRESS = z.string().refine(isAddress, "Invalid address").transform((v) => getAddress(v));

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
        signature: z.string().regex(/^0x[a-fA-F0-9]+$/),
        message: z.string().min(10).max(500),
        txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
        avatarUrl: z.string().url().optional(),
        bio: z.string().max(280).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    // 1. Verify the message was signed by the claimed wallet
    const ok = await verifyMessage({
      address: data.wallet,
      message: data.message,
      signature: data.signature as `0x${string}`,
    });
    if (!ok) throw new Error("Invalid signature");

    // 2. Confirm the registration tx exists on Celo and was sent by this wallet
    const tx = await publicClient.getTransaction({ hash: data.txHash as `0x${string}` }).catch(() => null);
    if (!tx) throw new Error("Transaction not found on Celo");
    if (tx.from.toLowerCase() !== data.wallet.toLowerCase()) {
      throw new Error("Transaction sender mismatch");
    }

    // 3. Upsert profile (wallet stored lowercased)
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
