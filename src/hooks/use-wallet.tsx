import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { connectWallet, ensureCelo, getInjected, isMiniPay } from "@/lib/wallet";

type WalletCtx = {
  address: `0x${string}` | null;
  isConnected: boolean;
  isMiniPay: boolean;
  connecting: boolean;
  connect: () => Promise<`0x${string}` | null>;
  disconnect: () => void;
};

const Ctx = createContext<WalletCtx | null>(null);
const STORAGE_KEY = "celovent.wallet";

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [mp, setMp] = useState(false);

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      await ensureCelo();
      const addr = await connectWallet();
      if (addr) {
        setAddress(addr);
        localStorage.setItem(STORAGE_KEY, addr);
      }
      return addr;
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setMp(isMiniPay());

    // MiniPay auto-connect (no popup per MiniPay docs)
    if (isMiniPay()) {
      connect();
      return;
    }
    const saved = localStorage.getItem(STORAGE_KEY) as `0x${string}` | null;
    if (saved) setAddress(saved);

    const eth = getInjected();
    if (!eth?.on) return;
    const handler = (accounts: unknown) => {
      const list = accounts as string[];
      if (!list?.length) disconnect();
      else setAddress(list[0] as `0x${string}`);
    };
    eth.on("accountsChanged", handler);
    return () => eth.removeListener?.("accountsChanged", handler);
  }, [connect, disconnect]);

  const value = useMemo<WalletCtx>(
    () => ({ address, isConnected: !!address, isMiniPay: mp, connecting, connect, disconnect }),
    [address, mp, connecting, connect, disconnect],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWallet() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}

export function shortAddress(a?: string | null) {
  if (!a) return "";
  return `${a.slice(0, 6)}...${a.slice(-4)}`;
}
