export const REGISTRY_ADDRESS = (import.meta.env.VITE_CELOVENT_REGISTRY_ADDRESS ??
  "0x86164d52CA338f2ce0bA9218135AF3a1E26E1063") as `0x${string}`;

export const REGISTRY_ABI = [
  { type: "function", name: "registerUser", stateMutability: "nonpayable", inputs: [{ name: "username", type: "string" }], outputs: [] },
  { type: "function", name: "usernames", stateMutability: "view", inputs: [{ name: "", type: "address" }], outputs: [{ name: "", type: "string" }] },
  { type: "function", name: "isRegistered", stateMutability: "view", inputs: [{ name: "wallet", type: "address" }], outputs: [{ name: "", type: "bool" }] },
] as const;

// Celo mainnet cUSD
export const CUSD_ADDRESS = "0x765DE816845861e75A25fCA122bb6898B8B1282a" as const;
export const CUSD_DECIMALS = 18;
export const ERC20_ABI = [
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "transfer", stateMutability: "nonpayable", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ name: "", type: "bool" }] },
  { type: "event", name: "Transfer", inputs: [
    { name: "from", type: "address", indexed: true },
    { name: "to", type: "address", indexed: true },
    { name: "value", type: "uint256", indexed: false },
  ] },
] as const;

// Subscription treasury (Celo)
export const TREASURY_ADDRESS = "0xd6B69E58D44e523EB58645F1B78425c96Dfa648C" as `0x${string}`;
export const SUB_PLANS = {
  daily:   { price: 0.5, days: 1,  label: "Daily Pass" },
  monthly: { price: 6,   days: 30, label: "Monthly Creator" },
} as const;
export type SubPlanId = keyof typeof SUB_PLANS;
