# Celovent

> **Meme remix social network on Celo, built for MiniPay.**
> Create memes. Remix them. Tip creators in cUSD. Crypto stays invisible.

[![Built on Celo](https://img.shields.io/badge/Built%20on-Celo-FCFF52?style=flat-square)](https://celo.org)
[![MiniPay](https://img.shields.io/badge/Wallet-MiniPay-A1FF3D?style=flat-square)](https://www.opera.com/products/minipay)
[![TanStack Start](https://img.shields.io/badge/Framework-TanStack%20Start-EF4444?style=flat-square)](https://tanstack.com/start)
[![Cloudflare Workers](https://img.shields.io/badge/Deploy-Cloudflare%20Workers-F38020?style=flat-square)](https://workers.cloudflare.com)

---

## What is Celovent?

Celovent is a **mobile-first meme social platform** native to the [MiniPay](https://www.opera.com/products/minipay) wallet inside Opera Mini, with **800M+ potential users across Africa**. Users:

- 📸 Create and remix memes
- 🔥 Scroll an infinite viral feed
- 💸 Tip creators in **cUSD** (1 cUSD = $1 USDC) directly on-chain
- 🤖 Optionally use AI to generate or remix memes
- 🟣 Earn purple-tick verification by subscribing in cUSD

Identity is **wallet-based** — no email, no password. The first time you open Celovent in MiniPay, you claim a username on-chain via the `CeloventRegistry` smart contract (one-time, ~$0.01 cUSD gas). After that, it's a regular social app — the chain is invisible.

---

## Stack

| Layer            | Choice                                                     |
| ---------------- | ---------------------------------------------------------- |
| Framework        | TanStack Start v1 (React 19, Vite 7, file-based routing)   |
| Styling          | Tailwind CSS v4 + custom design tokens (`src/styles.css`)  |
| Wallet           | **viem** + `window.ethereum.isMiniPay` detection           |
| Chain            | **Celo mainnet** (chainId `42220`)                         |
| Smart contract   | `CeloventRegistry.sol` — on-chain username claims          |
| Database         | Supabase (Postgres + RLS) — profiles, memes, tips          |
| Server runtime   | Cloudflare Workers (via `@cloudflare/vite-plugin`)         |
| Auth model       | Signature-verified profile upsert (`viem.verifyMessage`)   |

No CRA. No React Router DOM. No Wagmi. No `process.env` in client code.

---

## MiniPay Integration

Celovent is **MiniPay-first**. The wallet hook (`src/hooks/use-wallet.tsx`) auto-connects on load when `window.ethereum.isMiniPay === true` — no popup, no prompt, no signature for read-only flows (per [MiniPay docs](https://docs.celo.org/build/build-on-minipay)).

```ts
// src/lib/wallet.ts
export function isMiniPay() {
  return Boolean(window.ethereum?.isMiniPay);
}
```

cUSD balances are read live from the canonical Celo ERC-20 contract:

```
0x765DE816845861e75A25fCA122bb6898B8B1282a
```

All on-chain writes (registration, tipping) are routed through `viem`'s `writeContract` with `chain: celo`, so the user never sees a chain-switch popup.

---

## Project structure

```
src/
  routes/                 file-based routes (TanStack Router)
    __root.tsx            global layout + auth route guard
    connect.tsx           wallet → username → on-chain claim flow
    index.tsx             /feed
    create.tsx, remix.$id.tsx, explore.tsx, memebox.tsx,
    profile.tsx, wallet.tsx, subscribe.tsx
  hooks/
    use-wallet.tsx        MiniPay-aware wallet provider
    use-me.ts             live cUSD balance + Supabase profile
  lib/
    wallet.ts             viem clients, MiniPay detection, Celo switch
    contracts/registry.ts ABI + addresses (cUSD, registry)
    profile.functions.ts  TanStack server functions (signature-verified)
  integrations/supabase/  generated client (do not edit)
contracts/
  CeloventRegistry.sol    on-chain username registry
  DEPLOY.md               Remix deployment walkthrough
supabase/migrations/      RLS-protected profiles schema
```

---

## Setup

### 1. Install

```bash
bun install
```

### 2. Deploy the smart contract (~$0.02 CELO, 3 min)

Follow [`contracts/DEPLOY.md`](contracts/DEPLOY.md). You'll get back a contract address — add it as the env var:

```bash
# .env (and your deployment provider)
VITE_CELOVENT_REGISTRY_ADDRESS=0xYourDeployedAddress
```

### 3. Supabase (Lovable Cloud)

Already wired. The `profiles` table, RLS policies, and service-role server functions are migrated automatically. Service role key, URL, and publishable key are set as Lovable Cloud secrets — no manual config.

### 4. Run dev

```bash
bun run dev
```

Open in **MiniPay's in-app browser** for the real experience. In desktop Chrome, the connect page will prompt any injected wallet (MetaMask works fine — make sure it's on Celo mainnet).

---

## Deployment

### Recommended: Cloudflare Workers

The build outputs a ready-to-deploy Cloudflare Worker bundle. One command:

```bash
bunx wrangler deploy
```

Push secrets:

```bash
bunx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
bunx wrangler secret put SUPABASE_URL
bunx wrangler secret put SUPABASE_PUBLISHABLE_KEY
```

`VITE_CELOVENT_REGISTRY_ADDRESS` and the `VITE_SUPABASE_*` variables are baked in at build time — set them in `.env` before building.

The published URL works out of the box for the MiniPay in-app browser. No `public/_redirects`, no `vercel.json`, no SPA-fallback hacks needed — TanStack Start handles routing server-side.

### Why not Vercel?

The Lovable TanStack template ships with `@cloudflare/vite-plugin` and builds a Worker bundle (`dist/server/index.js` + `wrangler.json`). Vercel cannot execute Cloudflare Workers natively, so deploying as-is fails with `No Output Directory named "public" found`. Cloudflare Workers is the supported target.

---

## Smart contract

`contracts/CeloventRegistry.sol` — minimal, audited-style registry:

```solidity
function registerUser(string calldata username) external;
function usernames(address wallet) external view returns (string memory);
function isRegistered(address wallet) external view returns (bool);
event UserRegistered(address indexed wallet, string username, uint256 timestamp);
```

- Usernames are 3–24 chars, case-insensitive unique
- One wallet = one username (immutable after registration)
- Cost: ~$0.01 cUSD per claim

---

## Security

- **No client-side admin checks.** All writes to `profiles` go through TanStack server functions that verify a wallet signature (`viem.verifyMessage`) **and** confirm the on-chain registration tx exists on Celo.
- **RLS on by default.** `profiles` table has public `SELECT`, no client `INSERT`/`UPDATE`. Writes are server-only via `supabaseAdmin`.
- **Service role key never touches the browser** — it's only imported from `src/integrations/supabase/client.server.ts` which is bundler-blocked from client code.

---

## Roadmap

- [x] MiniPay wallet auto-connect + Celo network enforcement
- [x] On-chain username registry
- [x] Signature-verified Supabase profiles
- [x] Live cUSD balance in topbar
- [ ] On-chain tipping (cUSD `transfer` to creator wallet)
- [ ] Remix lineage stored on-chain
- [ ] AI meme generation (Lovable AI Gateway)
- [ ] Purple-tick subscriptions (recurring cUSD)
- [ ] Storage bucket for user-uploaded meme images

---

## License

MIT
