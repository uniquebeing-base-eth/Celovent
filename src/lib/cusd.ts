import { encodeFunctionData, parseUnits } from "viem";
import { CUSD_ADDRESS, CUSD_DECIMALS, ERC20_ABI } from "@/lib/contracts/registry";
import { ensureCelo, getInjected } from "@/lib/wallet";

/** Send cUSD on Celo via the injected wallet (MiniPay-compatible). Returns tx hash. */
export async function sendCusd(
  from: `0x${string}`,
  to: `0x${string}`,
  amount: number | string,
): Promise<`0x${string}`> {
  const eth = getInjected();
  if (!eth) throw new Error("No wallet detected");
  await ensureCelo();
  const data = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: "transfer",
    args: [to, parseUnits(String(amount), CUSD_DECIMALS)],
  });
  // MiniPay supports eth_sendTransaction with a single tx param
  const hash = (await eth.request({
    method: "eth_sendTransaction",
    params: [{ from, to: CUSD_ADDRESS, data, value: "0x0" }],
  })) as `0x${string}`;
  return hash;
}
