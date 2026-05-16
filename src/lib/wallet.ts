import { createPublicClient, createWalletClient, custom, http, type WalletClient, type PublicClient } from "viem";
import { celo } from "viem/chains";

declare global {
  interface Window {
    ethereum?: {
      isMiniPay?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, listener: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
    };
  }
}

export const publicClient: PublicClient = createPublicClient({
  chain: celo,
  transport: http("https://forno.celo.org"),
});

export function getInjected() {
  if (typeof window === "undefined") return null;
  return window.ethereum ?? null;
}

export function isMiniPay() {
  const eth = getInjected();
  return Boolean(eth?.isMiniPay);
}

export function getWalletClient(): WalletClient | null {
  const eth = getInjected();
  if (!eth) return null;
  return createWalletClient({ chain: celo, transport: custom(eth) });
}

export async function connectWallet(): Promise<`0x${string}` | null> {
  const eth = getInjected();
  if (!eth) return null;
  // MiniPay auto-approves; other wallets prompt
  const accounts = (await eth.request({ method: "eth_requestAccounts" })) as string[];
  return (accounts?.[0] as `0x${string}`) ?? null;
}

export async function ensureCelo(): Promise<void> {
  const eth = getInjected();
  if (!eth) return;
  const chainIdHex = (await eth.request({ method: "eth_chainId" })) as string;
  if (parseInt(chainIdHex, 16) === celo.id) return;
  try {
    await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: `0x${celo.id.toString(16)}` }] });
  } catch {
    await eth.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: `0x${celo.id.toString(16)}`,
          chainName: "Celo",
          nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
          rpcUrls: ["https://forno.celo.org"],
          blockExplorerUrls: ["https://celoscan.io"],
        },
      ],
    });
  }
}
