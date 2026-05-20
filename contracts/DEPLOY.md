# Deploying CeloventRegistry to Celo 

contract : 0x86164d52CA338f2ce0bA9218135AF3a1E26E1063

You need ~0.05 CELO (~$0.02) in a wallet with the Celo network added.

## Option A — Remix (easiest, 3 minutes)

1. Open https://remix.ethereum.org
2. Create a new file `CeloventRegistry.sol` and paste the contents of this folder's `CeloventRegistry.sol`.
3. **Solidity Compiler** tab → version `0.8.20` → **Compile**.
4. **Deploy & Run Transactions** tab:
   - Environment: **Injected Provider — MetaMask** (or MiniPay)
   - Connect a wallet that has CELO on Celo mainnet (chainId 42220)
   - Contract: `CeloventRegistry`
   - Click **Deploy** → confirm in wallet
5. Copy the deployed contract address.
6. In Lovable: add it as the secret/env var `VITE_CELOVENT_REGISTRY_ADDRESS`. Add the same in your Vercel project settings.

## Option B — Hardhat / Foundry

Standard deploy script targeting `https://forno.celo.org` (chainId 42220). The contract has no constructor args.

## After deploying

The frontend reads `VITE_CELOVENT_REGISTRY_ADDRESS` at build time. Restart the Lovable preview after adding the env var.
