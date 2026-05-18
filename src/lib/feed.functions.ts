import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createPublicClient, http, isAddress, getAddress, recoverMessageAddress } from "viem";
import { celo } from "viem/chains";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { buildMessage } from "@/lib/auth-sig";

const publicClient = createPublicClient({ chain: celo, transport: http("https://forno.celo.org") });
const ADDRESS = z.string().refine(isAddress, "Invalid address").transform((v) => getAddress(v));
const TX_HASH = z.string().regex(/^0x[a-fA-F0-9]{64}$/);
const MAX_SIG_AGE_MS = 10 * 60 * 1000;

export async function requireSignedAction(input: {
  wallet: `0x${string}`;
  signature: `0x${string}`;
  timestamp: number;
  action: string;
}) {
  if (Date.now() - input.timestamp > MAX_SIG_AGE_MS) throw new Error("Signature expired");
  const recovered = await recoverMessageAddress({
    message: buildMessage(input.wallet, input.action, input.timestamp),
    signature: input.signature,
  });
  if (recovered.toLowerCase() !== input.wallet.toLowerCase()) {
    throw new Error("Bad signature");
  }
}

const SIG_FIELDS = {
  signature: z.string().regex(/^0x[a-fA-F0-9]+$/),
  timestamp: z.number().int(),
  action: z.string().min(1).max(64),
};

// ──────────────── Feed ────────────────
export const getFeed = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ limit: z.number().min(1).max(50).default(30) }).parse(input ?? {}))
  .handler(async ({ data }) => {
    const { data: rows, error } = await supabaseAdmin
      .from("memes")
      .select("id, creator_wallet, image_url, caption, tags, parent_id, ai_generated, likes_count, remix_count, tips_total, created_at")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(error.message);
    const wallets = Array.from(new Set((rows ?? []).map((r) => r.creator_wallet)));
    const { data: profiles } = wallets.length
      ? await supabaseAdmin.from("profiles").select("wallet_address, username, avatar_url, purple_tick, purple_tick_expires_at").in("wallet_address", wallets)
      : { data: [] as Array<{ wallet_address: string; username: string; avatar_url: string | null; purple_tick: boolean; purple_tick_expires_at: string | null }> };
    return { memes: rows ?? [], profiles: profiles ?? [] };
  });

export const getUserMemes = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ wallet: ADDRESS }).parse(input))
  .handler(async ({ data }) => {
    const { data: rows, error } = await supabaseAdmin
      .from("memes")
      .select("id, image_url, caption, created_at")
      .eq("creator_wallet", data.wallet.toLowerCase())
      .order("created_at", { ascending: false })
      .limit(60);
    if (error) throw new Error(error.message);
    return { memes: rows ?? [] };
  });

// ──────────────── Post meme ────────────────
export const postMeme = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      wallet: ADDRESS,
      imageUrl: z.string().url(),
      caption: z.string().max(280).default(""),
      tags: z.array(z.string().min(1).max(30)).max(10).default([]),
      parentId: z.string().uuid().optional(),
      aiGenerated: z.boolean().default(false),
      ...SIG_FIELDS,
    }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireSignedAction({ wallet: data.wallet, signature: data.signature as `0x${string}`, timestamp: data.timestamp, action: data.action });
    if (data.action !== "post_meme") throw new Error("Bad action");

    const wallet = data.wallet.toLowerCase();
    const { data: row, error } = await supabaseAdmin
      .from("memes")
      .insert({
        creator_wallet: wallet,
        image_url: data.imageUrl,
        caption: data.caption,
        tags: data.tags,
        parent_id: data.parentId ?? null,
        ai_generated: data.aiGenerated,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    if (data.parentId) {
      await supabaseAdmin.rpc("execute", {}).catch(() => null);
      await supabaseAdmin.from("memes").update({ remix_count: (await supabaseAdmin.from("memes").select("remix_count").eq("id", data.parentId).single()).data?.remix_count ?? 0 + 1 }).eq("id", data.parentId);
    }
    return { meme: row };
  });

// ──────────────── Record on-chain tip ────────────────
export const recordTip = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      memeId: z.string().uuid(),
      fromWallet: ADDRESS,
      toWallet: ADDRESS,
      amount: z.number().positive(),
      txHash: TX_HASH,
    }).parse(input),
  )
  .handler(async ({ data }) => {
    // Verify tx exists and was sent by fromWallet
    const tx = await publicClient.getTransaction({ hash: data.txHash as `0x${string}` }).catch(() => null);
    if (!tx) throw new Error("Tx not found");
    if (tx.from.toLowerCase() !== data.fromWallet.toLowerCase()) throw new Error("Sender mismatch");
    const receipt = await publicClient.getTransactionReceipt({ hash: data.txHash as `0x${string}` }).catch(() => null);
    if (!receipt || receipt.status !== "success") throw new Error("Tx not confirmed");

    const { error } = await supabaseAdmin.from("meme_tips").insert({
      meme_id: data.memeId,
      from_wallet: data.fromWallet.toLowerCase(),
      to_wallet: data.toWallet.toLowerCase(),
      amount_cusd: data.amount,
      tx_hash: data.txHash,
    });
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);

    // Bump tips_total (best-effort)
    const { data: m } = await supabaseAdmin.from("memes").select("tips_total").eq("id", data.memeId).single();
    if (m) {
      await supabaseAdmin.from("memes").update({ tips_total: Number(m.tips_total) + data.amount }).eq("id", data.memeId);
    }
    return { ok: true };
  });
