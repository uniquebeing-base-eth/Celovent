import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  createPublicClient,
  http,
  isAddress,
  getAddress,
  recoverMessageAddress,
  decodeEventLog,
  parseUnits,
} from "viem";
import { celo } from "viem/chains";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { buildMessage } from "@/lib/auth-sig";
import { CUSD_ADDRESS, CUSD_DECIMALS, ERC20_ABI, TREASURY_ADDRESS } from "@/lib/contracts/registry";

const publicClient = createPublicClient({ chain: celo, transport: http("https://forno.celo.org") });
const ADDRESS = z.string().refine(isAddress, "Invalid address").transform((v) => getAddress(v));
const TX_HASH = z.string().regex(/^0x[a-fA-F0-9]{64}$/);
const MAX_SIG_AGE_MS = 15 * 60 * 1000;

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

const MEME_COLS =
  "id, creator_wallet, image_url, caption, tags, parent_id, ai_generated, manual_upload, allow_remixing, tipping_enabled, likes_count, remix_count, tips_total, created_at";

// ──────────────── Feed ────────────────
export const getFeed = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ limit: z.number().min(1).max(50).default(30) }).parse(input ?? {}))
  .handler(async ({ data }) => {
    const { data: rows, error } = await supabaseAdmin
      .from("memes")
      .select(MEME_COLS)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(error.message);
    const wallets = Array.from(new Set((rows ?? []).map((r) => r.creator_wallet)));
    const { data: profiles } = wallets.length
      ? await supabaseAdmin
          .from("profiles")
          .select("wallet_address, username, avatar_url, purple_tick, purple_tick_expires_at")
          .in("wallet_address", wallets)
      : { data: [] as Array<{
          wallet_address: string;
          username: string;
          avatar_url: string | null;
          purple_tick: boolean;
          purple_tick_expires_at: string | null;
        }> };
    return { memes: rows ?? [], profiles: profiles ?? [] };
  });

export const getMeme = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("memes")
      .select(MEME_COLS)
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return { meme: null, profile: null };
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("wallet_address, username, avatar_url, purple_tick, purple_tick_expires_at")
      .eq("wallet_address", row.creator_wallet)
      .maybeSingle();
    return { meme: row, profile };
  });

export const getUserMemes = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ wallet: ADDRESS }).parse(input))
  .handler(async ({ data }) => {
    const { data: rows, error } = await supabaseAdmin
      .from("memes")
      .select(MEME_COLS)
      .eq("creator_wallet", data.wallet.toLowerCase())
      .order("created_at", { ascending: false })
      .limit(60);
    if (error) throw new Error(error.message);
    return { memes: rows ?? [] };
  });

// ──────────────── Post meme ────────────────
export const postMeme = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        wallet: ADDRESS,
        imageUrl: z.string().url(),
        caption: z.string().max(280).default(""),
        tags: z.array(z.string().min(1).max(30)).max(10).default([]),
        parentId: z.string().uuid().optional(),
        aiGenerated: z.boolean().default(false),
        manualUpload: z.boolean().default(false),
        ...SIG_FIELDS,
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
    if (data.action !== "post_meme") throw new Error("Bad action");

    const wallet = data.wallet.toLowerCase();
    // Manual uploads: no remix, no tips.
    const allowRemixing = !data.manualUpload;
    const tippingEnabled = !data.manualUpload;

    const { data: row, error } = await supabaseAdmin
      .from("memes")
      .insert({
        creator_wallet: wallet,
        image_url: data.imageUrl,
        caption: data.caption,
        tags: data.tags,
        parent_id: data.parentId ?? null,
        ai_generated: data.aiGenerated,
        manual_upload: data.manualUpload,
        allow_remixing: allowRemixing,
        tipping_enabled: tippingEnabled,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    if (data.parentId) {
      const { data: parent } = await supabaseAdmin
        .from("memes")
        .select("remix_count, creator_wallet")
        .eq("id", data.parentId)
        .single();
      if (parent) {
        await supabaseAdmin
          .from("memes")
          .update({ remix_count: (parent.remix_count ?? 0) + 1 })
          .eq("id", data.parentId);
        await supabaseAdmin.from("notifications").insert({
          wallet: parent.creator_wallet,
          kind: "remix",
          body: `Your meme was remixed by ${wallet.slice(0, 6)}…${wallet.slice(-4)}`,
          meta: { meme_id: row.id, parent_id: data.parentId },
        });
      }
    }
    return { meme: row };
  });

// ──────────────── Likes ────────────────
export const toggleLike = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        wallet: ADDRESS,
        memeId: z.string().uuid(),
        ...SIG_FIELDS,
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
    if (data.action !== "like") throw new Error("Bad action");

    const wallet = data.wallet.toLowerCase();
    const { data: existing } = await supabaseAdmin
      .from("meme_likes")
      .select("id")
      .eq("meme_id", data.memeId)
      .eq("wallet", wallet)
      .maybeSingle();

    if (existing) {
      await supabaseAdmin.from("meme_likes").delete().eq("id", existing.id);
      const { data: m } = await supabaseAdmin
        .from("memes")
        .select("likes_count")
        .eq("id", data.memeId)
        .single();
      if (m) {
        await supabaseAdmin
          .from("memes")
          .update({ likes_count: Math.max(0, (m.likes_count ?? 1) - 1) })
          .eq("id", data.memeId);
      }
      return { liked: false };
    }

    await supabaseAdmin.from("meme_likes").insert({ meme_id: data.memeId, wallet });
    const { data: m } = await supabaseAdmin
      .from("memes")
      .select("likes_count, creator_wallet")
      .eq("id", data.memeId)
      .single();
    if (m) {
      await supabaseAdmin
        .from("memes")
        .update({ likes_count: (m.likes_count ?? 0) + 1 })
        .eq("id", data.memeId);
      if (m.creator_wallet !== wallet) {
        await supabaseAdmin.from("notifications").insert({
          wallet: m.creator_wallet,
          kind: "like",
          body: `${wallet.slice(0, 6)}…${wallet.slice(-4)} liked your meme`,
          meta: { meme_id: data.memeId },
        });
      }
    }
    return { liked: true };
  });

export const getMyInteractions = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ wallet: ADDRESS }).parse(input))
  .handler(async ({ data }) => {
    const wallet = data.wallet.toLowerCase();
    const { data: likes } = await supabaseAdmin
      .from("meme_likes")
      .select("meme_id")
      .eq("wallet", wallet);
    return { likedMemeIds: (likes ?? []).map((l) => l.meme_id) };
  });

// ──────────────── Tips ────────────────
export const recordTip = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        memeId: z.string().uuid(),
        fromWallet: ADDRESS,
        toWallet: ADDRESS,
        amount: z.number().positive(),
        txHash: TX_HASH,
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    // Confirm meme allows tipping.
    const { data: meme } = await supabaseAdmin
      .from("memes")
      .select("id, tipping_enabled, tips_total, creator_wallet")
      .eq("id", data.memeId)
      .maybeSingle();
    if (!meme) throw new Error("Meme not found");
    if (!meme.tipping_enabled) throw new Error("Tipping disabled for this meme");

    // Verify on-chain cUSD transfer with retries (RPC lag).
    const required = parseUnits(String(data.amount), CUSD_DECIMALS);
    let receipt = null as Awaited<ReturnType<typeof publicClient.getTransactionReceipt>> | null;
    for (let i = 0; i < 5; i++) {
      receipt = await publicClient
        .getTransactionReceipt({ hash: data.txHash as `0x${string}` })
        .catch(() => null);
      if (receipt) break;
      await new Promise((r) => setTimeout(r, 1500));
    }
    if (!receipt || receipt.status !== "success") throw new Error("Tip transaction not confirmed");

    let paid = false;
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== CUSD_ADDRESS.toLowerCase()) continue;
      try {
        const ev = decodeEventLog({ abi: ERC20_ABI, data: log.data, topics: log.topics });
        if (ev.eventName !== "Transfer") continue;
        const { from, to, value } = ev.args as { from: string; to: string; value: bigint };
        if (
          from.toLowerCase() === data.fromWallet.toLowerCase() &&
          to.toLowerCase() === data.toWallet.toLowerCase() &&
          value >= required
        ) {
          paid = true;
          break;
        }
      } catch {
        /* ignore */
      }
    }
    if (!paid) throw new Error("cUSD transfer not detected in tx");

    const { error } = await supabaseAdmin.from("meme_tips").insert({
      meme_id: data.memeId,
      from_wallet: data.fromWallet.toLowerCase(),
      to_wallet: data.toWallet.toLowerCase(),
      amount_cusd: data.amount,
      tx_hash: data.txHash,
    });
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);

    await supabaseAdmin
      .from("memes")
      .update({ tips_total: Number(meme.tips_total) + data.amount })
      .eq("id", data.memeId);

    await supabaseAdmin.from("notifications").insert({
      wallet: data.toWallet.toLowerCase(),
      kind: "tip",
      body: `Got ${data.amount} cUSD tip from ${data.fromWallet.slice(0, 6)}…${data.fromWallet.slice(-4)}`,
      meta: { meme_id: data.memeId, amount: data.amount, tx: data.txHash },
    });

    return { ok: true };
  });

// ──────────────── Wallet activity (real tx history) ────────────────
export const getWalletActivity = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ wallet: ADDRESS }).parse(input))
  .handler(async ({ data }) => {
    const wallet = data.wallet.toLowerCase();
    const [tipsIn, tipsOut, subs, boxes] = await Promise.all([
      supabaseAdmin
        .from("meme_tips")
        .select("amount_cusd, from_wallet, tx_hash, created_at")
        .eq("to_wallet", wallet)
        .order("created_at", { ascending: false })
        .limit(20),
      supabaseAdmin
        .from("meme_tips")
        .select("amount_cusd, to_wallet, tx_hash, created_at")
        .eq("from_wallet", wallet)
        .order("created_at", { ascending: false })
        .limit(20),
      supabaseAdmin
        .from("subscriptions")
        .select("plan, amount_cusd, tx_hash, created_at")
        .eq("wallet_address", wallet)
        .order("created_at", { ascending: false })
        .limit(10),
      supabaseAdmin
        .from("meme_box_openings")
        .select("box_type, price_cusd, tx_hash, reward_label, created_at")
        .eq("wallet", wallet)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    type TxRow = {
      kind: "in" | "out";
      label: string;
      amount: number;
      tx: string;
      at: string;
    };
    const out: TxRow[] = [];
    for (const t of tipsIn.data ?? [])
      out.push({
        kind: "in",
        label: `Tip from ${t.from_wallet.slice(0, 6)}…${t.from_wallet.slice(-4)}`,
        amount: Number(t.amount_cusd),
        tx: t.tx_hash,
        at: t.created_at,
      });
    for (const t of tipsOut.data ?? [])
      out.push({
        kind: "out",
        label: `Tip to ${t.to_wallet.slice(0, 6)}…${t.to_wallet.slice(-4)}`,
        amount: -Number(t.amount_cusd),
        tx: t.tx_hash,
        at: t.created_at,
      });
    for (const s of subs.data ?? [])
      out.push({
        kind: "out",
        label: `Purple Tick · ${s.plan}`,
        amount: -Number(s.amount_cusd),
        tx: s.tx_hash,
        at: s.created_at,
      });
    for (const b of boxes.data ?? [])
      out.push({
        kind: "out",
        label: `MemeBox · ${b.reward_label}`,
        amount: -Number(b.price_cusd),
        tx: b.tx_hash,
        at: b.created_at,
      });

    out.sort((a, b) => +new Date(b.at) - +new Date(a.at));
    return { txs: out.slice(0, 40), treasury: TREASURY_ADDRESS };
  });

// ──────────────── Explore: trending + top creators ────────────────
export const getExplore = createServerFn({ method: "POST" })
  .inputValidator(() => ({}))
  .handler(async () => {
    const { data: trending } = await supabaseAdmin
      .from("memes")
      .select(MEME_COLS)
      .order("likes_count", { ascending: false })
      .order("tips_total", { ascending: false })
      .limit(20);

    const { data: tipRows } = await supabaseAdmin
      .from("meme_tips")
      .select("to_wallet, amount_cusd")
      .limit(1000);

    const totals = new Map<string, number>();
    for (const t of tipRows ?? []) {
      totals.set(t.to_wallet, (totals.get(t.to_wallet) ?? 0) + Number(t.amount_cusd));
    }
    const topWallets = [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([w]) => w);

    const { data: profiles } = topWallets.length
      ? await supabaseAdmin
          .from("profiles")
          .select("wallet_address, username, avatar_url, purple_tick, purple_tick_expires_at")
          .in("wallet_address", topWallets)
      : { data: [] };

    const creators = topWallets.map((w) => {
      const p = profiles?.find((pp) => pp.wallet_address === w);
      return {
        wallet: w,
        username: p?.username ?? "anon",
        avatar:
          p?.avatar_url ??
          `https://api.dicebear.com/7.x/thumbs/svg?seed=${w}&backgroundColor=a1ff3d,b794f6,fb7185,facc15`,
        verified:
          !!p?.purple_tick &&
          (!p?.purple_tick_expires_at || new Date(p.purple_tick_expires_at) > new Date()),
        tips: totals.get(w) ?? 0,
      };
    });

    return { trending: trending ?? [], creators };
  });
