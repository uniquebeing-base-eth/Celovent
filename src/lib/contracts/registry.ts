export const REGISTRY_ADDRESS = (import.meta.env.VITE_CELOVENT_REGISTRY_ADDRESS ?? "") as `0x${string}`;

export const REGISTRY_ABI = [
  {
    type: "function",
    name: "registerUser",
    stateMutability: "nonpayable",
    inputs: [{ name: "username", type: "string" }],
    outputs: [],
  },
  {
    type: "function",
    name: "usernames",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "isRegistered",
    stateMutability: "view",
    inputs: [{ name: "wallet", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "event",
    name: "UserRegistered",
    inputs: [
      { name: "wallet", type: "address", indexed: true },
      { name: "username", type: "string", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
] as const;

// Celo mainnet cUSD
export const CUSD_ADDRESS = "0x765DE816845861e75A25fCA122bb6898B8B1282a" as const;
export const ERC20_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;
