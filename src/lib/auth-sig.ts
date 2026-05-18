import { getInjected } from "@/lib/wallet";

export type SignedAction = { wallet: `0x${string}`; signature: `0x${string}`; timestamp: number; action: string };

/** Build & sign an action message via personal_sign (supported by MiniPay). */
export async function signAction(wallet: `0x${string}`, action: string): Promise<SignedAction> {
  const eth = getInjected();
  if (!eth) throw new Error("No wallet detected");
  const timestamp = Date.now();
  const message = buildMessage(wallet, action, timestamp);
  const signature = (await eth.request({
    method: "personal_sign",
    params: [message, wallet],
  })) as `0x${string}`;
  return { wallet, signature, timestamp, action };
}

export function buildMessage(wallet: string, action: string, timestamp: number) {
  return `Celovent\naction:${action}\nwallet:${wallet.toLowerCase()}\nts:${timestamp}`;
}
