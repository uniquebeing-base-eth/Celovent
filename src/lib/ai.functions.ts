import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { isAddress, getAddress } from "viem";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSignedAction } from "@/lib/feed.functions";

const ADDRESS = z.string().refine(isAddress, "Invalid address").transform((v) => getAddress(v));

export const getAiQuota = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ wallet: ADDRESS }).parse(input))
  .handler(async ({ data }) => {
    const { data: p } = await supabaseAdmin
      .from("profiles")
      .select("ai_uses_remaining, purple_tick, purple_tick_expires_at")
      .eq("wallet_address", data.wallet.toLowerCase())
      .maybeSingle();
    const active = !!p?.purple_tick && (!p?.purple_tick_expires_at || new Date(p.purple_tick_expires_at) > new Date());
    return { remaining: p?.ai_uses_remaining ?? 0, purpleTick: active };
  });

export const generateMeme = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      wallet: ADDRESS,
      prompt: z.string().min(2).max(300),
      style: z.string().max(20).default("auto"),
      signature: z.string().regex(/^0x[a-fA-F0-9]+$/),
      timestamp: z.number().int(),
      action: z.literal("ai_generate"),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireSignedAction({ wallet: data.wallet, signature: data.signature as `0x${string}`, timestamp: data.timestamp, action: data.action });

    const wallet = data.wallet.toLowerCase();
    const { data: profile, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("ai_uses_remaining, purple_tick, purple_tick_expires_at")
      .eq("wallet_address", wallet)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!profile) throw new Error("Register first");

    const subActive = !!profile.purple_tick && (!profile.purple_tick_expires_at || new Date(profile.purple_tick_expires_at) > new Date());
    if (!subActive && (profile.ai_uses_remaining ?? 0) <= 0) {
      throw new Error("OUT_OF_USES");
    }

    // Call Lovable AI gateway
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI not configured");

    const stylePrompt = data.style && data.style !== "auto" ? ` in ${data.style} style` : "";
    const fullPrompt = `Create a funny crypto/Celo meme image${stylePrompt}. Concept: ${data.prompt}. Bold meme typography, vibrant colors, square format.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: fullPrompt }],
        modalities: ["image", "text"],
      }),
    });
    if (!aiRes.ok) {
      if (aiRes.status === 429) throw new Error("Rate limited, try again in a moment");
      if (aiRes.status === 402) throw new Error("AI credits exhausted — contact the app owner");
      throw new Error(`AI error ${aiRes.status}`);
    }
    const aiJson = await aiRes.json();
    const dataUrl: string | undefined = aiJson?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!dataUrl?.startsWith("data:image/")) throw new Error("No image returned");
    const [meta, b64] = dataUrl.split(",");
    const mime = meta.slice(5, meta.indexOf(";"));
    const ext = mime.split("/")[1] ?? "png";
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

    const path = `${wallet}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: upErr } = await supabaseAdmin.storage.from("memes").upload(path, bytes, { contentType: mime, upsert: false });
    if (upErr) throw new Error(upErr.message);
    const { data: pub } = supabaseAdmin.storage.from("memes").getPublicUrl(path);

    // Decrement quota only for non-subscribers
    if (!subActive) {
      await supabaseAdmin
        .from("profiles")
        .update({ ai_uses_remaining: Math.max(0, (profile.ai_uses_remaining ?? 0) - 1) })
        .eq("wallet_address", wallet);
    }

    return { imageUrl: pub.publicUrl, remaining: subActive ? "unlimited" : Math.max(0, (profile.ai_uses_remaining ?? 1) - 1) };
  });
