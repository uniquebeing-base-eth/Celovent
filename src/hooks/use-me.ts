import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { readContract } from "viem/actions";
import { formatUnits } from "viem";
import { useWallet } from "@/hooks/use-wallet";
import { publicClient } from "@/lib/wallet";
import { CUSD_ADDRESS, ERC20_ABI } from "@/lib/contracts/registry";
import { getProfile } from "@/lib/profile.functions";

export type ProfileRow = {
  wallet_address: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  verified: boolean;
  purple_tick: boolean;
  tx_hash: string | null;
  created_at: string;
};

export function useMe() {
  const { address, isConnected } = useWallet();
  const fetchProfile = useServerFn(getProfile);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) {
      setProfile(null);
      setBalance("0");
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [{ profile: row }, raw] = await Promise.all([
          fetchProfile({ data: { wallet: address } }),
          readContract(publicClient, {
            address: CUSD_ADDRESS,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [address],
          }) as Promise<bigint>,
        ]);
        if (cancelled) return;
        setProfile(row as ProfileRow | null);
        setBalance(Number(formatUnits(raw, 18)).toFixed(2));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [address, fetchProfile]);

  return { address, isConnected, profile, balance, loading };
}
