// Backend relayer: receives a tip payload, signs sendTip() on the
// senditwithcelo CeloTip contract using RELAYER_PRIVATE_KEY, and returns
// the on-chain tx hash. The relayer pays the gas; the user pays nothing.
//
// Security:
//  - Private key NEVER leaves the server.
//  - All inputs validated with Zod (addresses, amounts, lengths).
//  - Replay is non-issue: each call mines an independent tx; the on-chain
//    transferFrom enforces that the user has approved enough cUSD to the
//    CeloTip contract for the amount being moved.
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { createPublicClient, createWalletClient, http, isAddress, getAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { celo } from "viem/chains";
import { CELOTIP_ADDRESS, CELOTIP_ABI } from "senditwithcelo-sdk";

const Address = z.string().refine(isAddress, "Invalid address").transform((v) => getAddress(v));

const PayloadSchema = z.object({
  from: Address,
  to: Address,
  tokenAddress: Address,
  amount: z.string().regex(/^\d+$/, "amount must be base-unit string"),
  interactionType: z.string().min(1).max(32).default("tip"),
  castHash: z.string().min(1).max(256).default(""),
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function handleRelay(request: Request): Promise<Response> {
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const pk = process.env.RELAYER_PRIVATE_KEY;
  if (!pk) return jsonResponse({ error: "Relayer not configured" }, 500);

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }
  const parsed = PayloadSchema.safeParse(payload);
  if (!parsed.success) return jsonResponse({ error: parsed.error.message }, 400);

  const normalized = pk.startsWith("0x") ? (pk as `0x${string}`) : (`0x${pk}` as `0x${string}`);
  const account = privateKeyToAccount(normalized);

  const publicClient = createPublicClient({ chain: celo, transport: http("https://forno.celo.org") });
  const walletClient = createWalletClient({ account, chain: celo, transport: http("https://forno.celo.org") });

  try {
    // Simulate first to surface allowance / balance errors with a clean message.
    await publicClient.simulateContract({
      account,
      address: CELOTIP_ADDRESS as `0x${string}`,
      abi: CELOTIP_ABI,
      functionName: "sendTip",
      args: [
        parsed.data.from,
        parsed.data.to,
        parsed.data.tokenAddress,
        BigInt(parsed.data.amount),
        parsed.data.interactionType,
        parsed.data.castHash,
      ],
    });

    const hash = await walletClient.writeContract({
      address: CELOTIP_ADDRESS as `0x${string}`,
      abi: CELOTIP_ABI,
      functionName: "sendTip",
      args: [
        parsed.data.from,
        parsed.data.to,
        parsed.data.tokenAddress,
        BigInt(parsed.data.amount),
        parsed.data.interactionType,
        parsed.data.castHash,
      ],
    });
    return jsonResponse({ hash });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Relay failed";
    // Trim viem's verbose stack to one line for the client toast.
    const short = msg.split("\n")[0].slice(0, 240);
    return jsonResponse({ error: short }, 502);
  }
}

export const Route = createFileRoute("/api/public/relay-tip")({
  server: {
    handlers: {
      POST: ({ request }) => handleRelay(request),
    },
  },
});
