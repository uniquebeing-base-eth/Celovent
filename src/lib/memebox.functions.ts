import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  createPublicClient,
  http,
  isAddress,
  getAddress,
  decodeEventLog,
  parseUnits,
} from "viem";
import { celo } from "viem/chains";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  CUSD_ADDRESS,
  CUSD_DECIMALS,
  ERC20_ABI,
  TREASURY_ADDRESS,
} from "@/lib/contracts/registry";

const publicClient = createPublicClient({ chain: celo, transport: http("https://forno.celo.org") });
const ADDRESS = z.string().refine(isAddress, "Invalid address").transform((v) => getAddress(v));
const TX_HASH = z.string().regex(/^0x[a-fA-F0-9]{64}$/);

export const BOX_CATALOG = {
  common: { price: 1, label: "Common Box" },
  rare: { price: 5, label: "Rare Box" },
  legendary: { price: 10, label: "Legendary Box" },
} as const;
export type BoxId = keyof typeof BOX_CATALOG;

type RewardSpec = {
  type: "ai_uses" | "purple_tick_days" | "collectible" | "cusd_bonus";
  value: string;
  label: string;
  emoji: string;
};

const RAND = (n: number) => Math.floor(Math.random() * n);

function pickReward(box: BoxId): RewardSpec {
  // Weighted random — every box gives SOMETHING good.
  if (box === "common") {
    const roll = Math.random();
    if (roll < 0.5) return { type: "ai_uses", value: "3", label: "+3 AI generations", emoji: "✨" };
    if (roll < 0.85) return { type: "collectible", value: "pepe-classic", label: "Pepe Classic template", emoji: "🐸" };
    return { type: "purple_tick_days", value: "1", label: "1-day Purple Tick", emoji: "🟣" };
  }
  if (box === "rare") {
    const roll = Math.random();
    if (roll < 0.4) return { type: "ai_uses", value: "15", label: "+15 AI generations", emoji: "✨" };
    if (roll < 0.7) return { type: "purple_tick_days", value: "3", label: "3-day Purple Tick", emoji: "🟣" };
    if (roll < 0.9) return { type: "collectible", value: "wojak-rare", label: "Rare Wojak skin", emoji: "😐" };
    return { type: "cusd_bonus", value: "0.5", label: "0.5 cUSD style credit", emoji: "💸" };
  }
  // legendary
  const roll = Math.random();
  if (roll < 0.4) return { type: "purple_tick_days", value: "14", label: "14-day Purple Tick", emoji: "🟣" };
  if (roll < 0.7) return { type: "ai_uses", value: "50", label: "+50 AI generations", emoji: "✨" };
  if (roll < 0.9) return { type: "collectible", value: "legendary-anime", label: "Legendary Anime pack", emoji: "🌸" };
  return { type: "cusd_bonus", value: "2", label: "2 cUSD style credit", emoji: "💸" };
}

export const openMemeBox = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        wallet: ADDRESS,
        box: z.enum(["common", "rare", "legendary"]),
        txHash: TX_HASH,
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const wallet = data.wallet.toLowerCase();
    const spec = BOX_CATALOG[data.box];
    const required = parseUnits(String(spec.price), CUSD_DECIMALS);

    // Dedupe — one reward per tx.
    const { data: existing } = await supabaseAdmin
      .from("meme_box_openings")
      .select("id, reward_type, reward_value, reward_label, reward_emoji, box_type")
      .eq("tx_hash", data.txHash)
      .maybeSingle();
    if (existing) {
      return {
        already: true,
        reward: {
          type: existing.reward_type,
          value: existing.reward_value,
          label: existing.reward_label,
          emoji: existing.reward_emoji,
        },
      };
    }

    // Verify on-chain cUSD payment to treasury.
    let receipt = null as Awaited<ReturnType<typeof publicClient.getTransactionReceipt>> | null;
    for (let i = 0; i < 5; i++) {
      receipt = await publicClient
        .getTransactionReceipt({ hash: data.txHash as `0x${string}` })
        .catch(() => null);
      if (receipt) break;
      await new Promise((r) => setTimeout(r, 1500));
    }
    if (!receipt || receipt.status !== "success") throw new Error("Payment not confirmed");

    let paid = false;
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== CUSD_ADDRESS.toLowerCase()) continue;
      try {
        const ev = decodeEventLog({ abi: ERC20_ABI, data: log.data, topics: log.topics });
        if (ev.eventName !== "Transfer") continue;
        const { from, to, value } = ev.args as { from: string; to: string; value: bigint };
        if (
          from.toLowerCase() === wallet &&
          to.toLowerCase() === TREASURY_ADDRESS.toLowerCase() &&
          value >= required
        ) {
          paid = true;
          break;
        }
      } catch {
        /* ignore */
      }
    }
    if (!paid) throw new Error("cUSD payment to treasury not detected");

    const reward = pickReward(data.box);

    const { error: insErr } = await supabaseAdmin.from("meme_box_openings").insert({
      wallet,
      box_type: data.box,
      price_cusd: spec.price,
      tx_hash: data.txHash,
      reward_type: reward.type,
      reward_value: reward.value,
      reward_label: reward.label,
      reward_emoji: reward.emoji,
    });
    if (insErr && !insErr.message.includes("duplicate")) throw new Error(insErr.message);

    // Apply reward to the profile.
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("ai_uses_remaining, purple_tick_expires_at")
      .eq("wallet_address", wallet)
      .maybeSingle();

    if (reward.type === "ai_uses") {
      await supabaseAdmin
        .from("profiles")
        .update({ ai_uses_remaining: (profile?.ai_uses_remaining ?? 0) + Number(reward.value) })
        .eq("wallet_address", wallet);
    } else if (reward.type === "purple_tick_days") {
      const base =
        profile?.purple_tick_expires_at && new Date(profile.purple_tick_expires_at) > new Date()
          ? new Date(profile.purple_tick_expires_at)
          : new Date();
      const expires = new Date(base.getTime() + Number(reward.value) * 86_400_000);
      await supabaseAdmin
        .from("profiles")
        .update({ purple_tick: true, purple_tick_expires_at: expires.toISOString() })
        .eq("wallet_address", wallet);
    }

    await supabaseAdmin.from("notifications").insert({
      wallet,
      kind: "memebox",
      body: `Opened ${spec.label} → ${reward.emoji} ${reward.label}`,
      meta: { box: data.box, reward, tx: data.txHash },
    });

    return { already: false, reward };
  });

export const getMyBoxes = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ wallet: ADDRESS }).parse(input))
  .handler(async ({ data }) => {
    const { data: rows } = await supabaseAdmin
      .from("meme_box_openings")
      .select("box_type, reward_label, reward_emoji, reward_type, reward_value, created_at, tx_hash")
      .eq("wallet", data.wallet.toLowerCase())
      .order("created_at", { ascending: false })
      .limit(30);
    return { boxes: rows ?? [] };
  });
