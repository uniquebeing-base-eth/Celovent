/**
 * Client-side helper: tip / pay via the backend relayer using senditwithcelo-sdk.
 * User approves the CeloTip contract ONCE per token; subsequent transfers cost
 * the user $0 gas because the relayer signs `sendTip(...)` on-chain.
 */
import { sendTip } from "senditwithcelo-sdk";
import { publicClient, getWalletClient, ensureCelo } from "@/lib/wallet";
import { CUSD_ADDRESS } from "@/lib/contracts/registry";

export const RELAYER_URL = "/api/public/relay-tip";

export type RelayPayParams = {
  from: `0x${string}`;
  to: `0x${string}`;
  amount: number | string;
  interactionType?: "tip" | "subscription" | "memebox";
  message?: string;
};

export async function relayPayCusd(params: RelayPayParams): Promise<`0x${string}`> {
  await ensureCelo();
  const wallet = getWalletClient();
  if (!wallet) throw new Error("No wallet detected");
  const { hash } = await sendTip({
    from: params.from,
    to: params.to,
    tokenAddress: CUSD_ADDRESS,
    amount: String(params.amount),
    decimals: 18,
    interactionType: params.interactionType ?? "tip",
    message: params.message,
    relayerUrl: RELAYER_URL,
    // viem's chain-typed clients are structurally compatible but TS struggles
    // with the deep generic on celo — cast to satisfy the SDK signature.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    walletClient: wallet as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    publicClient: publicClient as any,
  });
  return hash as `0x${string}`;
}
