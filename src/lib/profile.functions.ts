import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { isAddress, getAddress } from "viem";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSignedAction } from "@/lib/feed.functions";

const ADDRESS = z
  .string()
  .refine(isAddress, "Invalid address")
  .transform((v) => getAddress(v));

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

/**
 * Off-chain username claim, gated by a wallet signature.
 * No gas required — users can enter the app even with cUSD-only MiniPay balances.
 * Username uniqueness is enforced by the case-insensitive unique index.
 */
export const claimUsername = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        wallet: ADDRESS,
        username: z
          .string()
          .min(3)
          .max(24)
          .regex(/^[a-zA-Z0-9_.-]+$/, "Invalid username"),
        bio: z.string().max(280).optional(),
        signature: z.string().regex(/^0x[a-fA-F0-9]+$/),
        timestamp: z.number().int(),
        action: z.literal("claim_username"),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    await requireSignedAction({
      wallet: data.wallet,
      signature: data.signature as `0x${string}`,
      timestamp: data.timestamp,
      action: data.action,
    });

    const walletLower = data.wallet.toLowerCase();

    // If this wallet already has a profile, return it (idempotent).
    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("wallet_address", walletLower)
      .maybeSingle();
    if (existing) return { profile: existing };

    const { data: row, error } = await supabaseAdmin
      .from("profiles")
      .insert({
        wallet_address: walletLower,
        username: data.username,
        avatar_url: `https://api.dicebear.com/7.x/thumbs/svg?seed=${walletLower}&backgroundColor=a1ff3d,b794f6,fb7185,facc15`,
        bio: data.bio ?? "",
      })
      .select()
      .single();
    if (error) {
      if (error.code === "23505") throw new Error("Username already taken");
      throw new Error(error.message);
    }

    return { profile: row };
  });
