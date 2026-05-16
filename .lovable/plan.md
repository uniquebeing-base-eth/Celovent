## Scope

Replace the mocked `me` with a real MiniPay wallet flow, a Celo mainnet `CeloventRegistry` contract for `registerUser(username)`, automatic Supabase profile creation, and Vercel as the deploy target.

## 1. Smart contract (you deploy, I write)

**Honest constraint:** I cannot deploy to Celo mainnet for you — that needs a funded deployer key, which should never live in a Lovable sandbox or repo. I will:

- Write `contracts/CeloventRegistry.sol` with:
  - `registerUser(string username)` — one-time per wallet, emits `UserRegistered(address, string, uint256)`
  - `usernames(address)` getter, `takenUsernames(string)` mapping for uniqueness
  - `isRegistered(address)` helper
- Provide a one-shot Remix deployment guide (copy file → compile → "Injected Provider — MiniPay/MetaMask on Celo" → Deploy). Cost: ~$0.01 in CELO.
- You paste the deployed address into one env var: `VITE_CELOVENT_REGISTRY_ADDRESS`.

I'll also ship the ABI as a static JSON in `src/lib/contracts/`.

## 2. Wallet connection (MiniPay-first)

- Add `viem` (no wagmi — overkill for a single contract call, and lighter for MiniPay's injected provider).
- `src/lib/wallet.ts`: detect `window.ethereum.isMiniPay`, fall back to generic injected provider for desktop testing. Auto-connect on load when MiniPay is detected (per MiniPay docs — no popup needed).
- `src/hooks/use-wallet.ts`: React hook exposing `{ address, isConnected, isMiniPay, connect, disconnect, chainId }`.
- Force Celo mainnet (chainId 42220); prompt switch if wrong network.

## 3. Auth model (wallet-as-identity, not Supabase email auth)

**Trade-off you should know:** MiniPay users don't have email accounts in your app. Two options for tying wallet → Supabase RLS:

- **Chosen path: signature-verified profile via admin server fn.** On first registration, client signs a nonce; server fn verifies signature with viem, then `supabaseAdmin` upserts the profile row. RLS on `profiles` is `USING (true)` for SELECT (public profiles), writes only via verified server fn. Simple, no email/password, no SIWE library.
- Rejected: full SIWE + Supabase JWT minting — much more code for V1.

## 4. Database

New migration:
- `profiles` table: `wallet_address text PK`, `username text unique`, `avatar_url`, `bio`, `verified bool`, `purple_tick bool`, `balance_cusd numeric`, `created_at`, `updated_at`, `tx_hash text` (registration tx).
- RLS: public SELECT, no direct INSERT/UPDATE from client (all writes via server fn with service role).
- Index on `username`.

## 5. Server functions

- `src/lib/profile.functions.ts`:
  - `getProfile({ wallet })` — public read.
  - `createProfile({ wallet, username, signature, message, txHash })` — verifies signature with `viem.verifyMessage`, confirms `txHash` exists on Celo via public RPC, then upserts profile.
- New secret: none required — Celo mainnet RPC is public (`https://forno.celo.org`).

## 6. UI changes

- New `/connect` route: MiniPay detection card → connect button → if not registered on-chain, show username form → "Claim username" calls contract → on tx confirm, calls `createProfile` server fn → redirect to `/`.
- `src/routes/__root.tsx`: add wallet provider context; if no wallet connected, redirect protected routes to `/connect`.
- `TopBar.tsx`: replace mock balance with live `cUSD` balance read from Celo (cUSD ERC20 at `0x765DE816845861e75A25fCA122bb6898B8B1282a`).
- `profile.tsx`: read profile from Supabase by connected wallet.
- Keep mock feed (`mock-data.ts`) untouched for this turn — out of scope.

## 7. Vercel deployment

- Add `vercel.json` with framework preset and the TanStack Start build output.
- Update `vite.config.ts` to use `target: 'vercel'` on the tanstack plugin.
- **Honest constraint:** Lovable's built-in publish uses Cloudflare Workers. After this change, "Publish" inside Lovable will likely break or produce a Cloudflare-incompatible build. You'll deploy by pushing to GitHub → Vercel auto-deploys. I'll leave `wrangler.jsonc` in place but it will be unused.
- Vercel env vars you'll need to set in the Vercel dashboard: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_CELOVENT_REGISTRY_ADDRESS`.

## Out of scope this turn

- Tipping/remix on-chain (still mocked).
- AI generation wiring.
- Storage bucket for avatars (uses dicebear for now).
- Migrating mock memes to Supabase.

## What you do after I'm done

1. Deploy `CeloventRegistry.sol` via Remix → copy address.
2. Add `VITE_CELOVENT_REGISTRY_ADDRESS` as a Lovable secret (and to Vercel).
3. Test in MiniPay browser on Opera Mini / your phone.
4. Connect Vercel to your GitHub repo for deploys.

Confirm and I'll build it.