import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createPublicClient, http, isAddress, getAddress, decodeEventLog, parseUnits } from "viem";
import { celo } from "viem/chains";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { CUSD_ADDRESS, CUSD_DECIMALS, ERC20_ABI, SUB_PLANS, TREASURY_ADDRESS, type SubPlanId } from "@/lib/contracts/registry";

const publicClient = createPublicClient({ chain: celo, transport: http("https://forno.celo.org") });
const ADDRESS = z.string().refine(isAddress, "Invalid address").transform((v) => getAddress(v));
const TX_HASH = z.string().regex(/^0x[a-fA-F0-9]{64}$/);

export const activateSubscription = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      wallet: ADDRESS,
      plan: z.enum(["daily", "monthly"]),
      txHash: TX_HASH,
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const plan = SUB_PLANS[data.plan as SubPlanId];
    const required = parseUnits(String(plan.price), CUSD_DECIMALS);

    const receipt = await publicClient
      .getTransactionReceipt({ hash: data.txHash as `0x${string}` })
      .catch(() => null);
    if (!receipt || receipt.status !== "success") throw new Error("Transaction not confirmed");

    const tx = await publicClient.getTransaction({ hash: data.txHash as `0x${string}` }).catch(() => null);
    if (!tx) throw new Error("Tx not found");
    if (tx.from.toLowerCase() !== data.wallet.toLowerCase()) throw new Error("Sender mismatch");
    if (tx.to?.toLowerCase() !== CUSD_ADDRESS.toLowerCase()) throw new Error("Not a cUSD transfer");

    // Find Transfer log: from=wallet, to=treasury, value>=required
    let paid = false;
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== CUSD_ADDRESS.toLowerCase()) continue;
      try {
        const ev = decodeEventLog({ abi: ERC20_ABI, data: log.data, topics: log.topics });
        if (ev.eventName !== "Transfer") continue;
        const { from, to, value } = ev.args as { from: string; to: string; value: bigint };
        if (
          from.toLowerCase() === data.wallet.toLowerCase() &&
          to.toLowerCase() === TREASURY_ADDRESS.toLowerCase() &&
          value >= required
        ) {
          paid = true;
          break;
        }
      } catch { /* ignore */ }
    }
    if (!paid) throw new Error("Payment to treasury not detected");

    const wallet = data.wallet.toLowerCase();
    // Extend expiry from max(now, current expiry)
    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("purple_tick_expires_at")
      .eq("wallet_address", wallet)
      .maybeSingle();
    const base = existing?.purple_tick_expires_at && new Date(existing.purple_tick_expires_at) > new Date()
      ? new Date(existing.purple_tick_expires_at)
      : new Date();
    const expires = new Date(base.getTime() + plan.days * 86400_000);

    const { error: subErr } = await supabaseAdmin.from("subscriptions").insert({
      wallet_address: wallet,
      plan: data.plan,
      amount_cusd: plan.price,
      tx_hash: data.txHash,
      expires_at: expires.toISOString(),
    });
    if (subErr && !subErr.message.includes("duplicate")) throw new Error(subErr.message);

    const { error: upErr } = await supabaseAdmin
      .from("profiles")
      .update({
        purple_tick: true,
        purple_tick_expires_at: expires.toISOString(),
        ai_uses_remaining: 9999, // effectively unlimited while sub active
      })
      .eq("wallet_address", wallet);
    if (upErr) throw new Error(upErr.message);

    return { ok: true, expiresAt: expires.toISOString() };
  });
