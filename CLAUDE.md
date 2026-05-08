# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Blockchain real estate marketplace for Paradise Valley (24 plots). Every plot is an ERC-721A NFT. Secondary-market sales auto-deduct 2% commission to admin via smart contract. Three roles: Admin, Dealer, End User. Homepage is a clickable SVG sector map; click any plot to see full on-chain ownership history.

---

## Stack & Exact Versions

| Layer | Tool | Version |
|-------|------|---------|
| Solidity | solc-js (NO Hardhat, NO Foundry) | 0.8.35 |
| NFT standard | erc721a (Chiru Labs) | 4.3.0 |
| Contract helpers | @openzeppelin/contracts | 5.6.1 |
| Deployment | ethers.js | 6.16.0 |
| Frontend | Next.js App Router | 16.2.5 |
| Styling | Tailwind CSS | 4.2.4 |
| Wallet UI | RainbowKit | 2.2.11 |
| Chain hooks | wagmi | 3.6.9 |
| Low-level RPC | viem | 2.48.8 |
| Server cache | TanStack Query | 5.x |
| IPFS | pinata SDK | 2.5.6 |
| PDF | jsPDF | 4.2.1 |
| PDF raster | html2canvas | 1.4.1 |
| QR codes | qrcode | 1.5.4 |
| Icons | lucide-react | 1.14.0 |
| Chain | Sepolia testnet | — |
| Package manager | npm | — |

---

## Architecture

Three contracts work together: `RoleManager.sol` is the auth source of truth — both `PlotNFT.sol` and `PlotMarketplace.sol` call into it before any privileged action. `PlotNFT.sol` (ERC-721A) holds plot ownership and tokenURIs (IPFS CIDs). `PlotMarketplace.sol` handles listings and payments, routing commission to admin on every non-admin sale. The frontend reads ownership history entirely from on-chain `Transfer` + `PlotSold` events via viem; it never writes history to Pinata. Pinata holds only immutable mint-time metadata (name, size, coordinates, image). Wallet-gated pages (admin/dealer) read the connected address against RoleManager. PDF certificates are generated client-side from on-chain data.

```
contracts/RoleManager.sol ──────────────────────────────────┐
        │ isAdmin / isDealer                                  │
        ▼                                                     ▼
contracts/PlotNFT.sol                   contracts/PlotMarketplace.sol
  ERC-721A + tokenURIs                    listPlot / buyPlot / commission
        │ Transfer events                         │ PlotSold events
        └──────────────┬──────────────────────────┘
                       ▼ viem getLogs
          frontend/hooks/usePlotHistory.js
          frontend/hooks/usePlotNFT.js       ← usePlotOwners (batch ownerOf)
          frontend/hooks/useMarketplace.js   ← useListings (batch getListingDetails)
                       │
          frontend/components/SectorMap.jsx  ← overlays live status on sectorLayout coords
          frontend/components/PlotDetailPanel.jsx
          frontend/components/HistoryTimeline.jsx
                Pinata gateway
          ← tokenURI → ipfs://<CID> → plot metadata JSON
          frontend/hooks/usePinataMetadata.js → /api/pinata/metadata?cid=...
```

### Critical data-flow: map status overlay

`lib/sectorLayout.js` provides **only** plot coordinates, SVG geometry, zone definitions, and stable metadata (size, facing, street). It intentionally contains mock statuses for development. For production, `SectorMap` must read live statuses by calling:
- `usePlotOwners(tokenIds)` → `{ [tokenId]: address | null }` (null = not minted)
- `useListings(tokenIds)` → `{ [tokenId]: { isActive, price, seller } | null }`

Derive status: `isActive listing → "listed"`, `owner === adminAddress → "available"`, `owner !== adminAddress && !listed → "sold"`, `ownerOf reverts / null → "unminted"`.

Both hooks batch all reads in a single `useReadContracts` call — never call them in a loop.

---

## Directory Map

```
plotchain/
├── contracts/          3 Solidity files: PlotNFT, PlotMarketplace, RoleManager
├── compile/
│   ├── compile.js      solc-js runner with OZ import-resolver callback
│   └── output/         ABI + bytecode JSON (gitignored, generated)
├── deploy/
│   ├── deploy.js       ethers.js ContractFactory deploy to Sepolia
│   ├── seed.js         pins 24 plot metadata JSONs to Pinata, calls batchMint once
│   └── plotData.json   24-plot definitions (PV-01 through PV-24)
├── frontend/
│   ├── app/            Next.js App Router pages + API routes
│   │   ├── api/pinata/ metadata (GET, proxies Pinata gateway) + upload (POST, server-only)
│   │   ├── admin/      Admin dashboard — role-gated via RoleGuard
│   │   ├── dealer/     Dealer portal — role-gated via RoleGuard
│   │   ├── dashboard/  User portfolio page
│   │   └── plots/      Full plot grid/list view
│   ├── components/
│   │   ├── SectorMap.jsx        SVG map — reads sectorLayout coords, overlays chain status
│   │   ├── PlotDetailPanel.jsx  Slide-in panel — opened when map plot is clicked
│   │   ├── HistoryTimeline.jsx  Renders usePlotHistory events
│   │   ├── MintModal.jsx        Admin mint flow (Pinata upload → mint tx)
│   │   ├── RoleGuard.jsx        Wraps pages; redirects if role missing
│   │   ├── AddressPill.jsx      Truncated address + copy + Etherscan link
│   │   ├── StatCard.jsx         Reusable stat tile used in admin/dealer dashboards
│   │   ├── StatusBadge.jsx      Colored chip for plot status
│   │   ├── Toaster.jsx          Toast notification system (useToast hook)
│   │   ├── CertificateGenerator.jsx  jsPDF + html2canvas PDF cert
│   │   ├── ConnectPrompt.jsx    Shown to unauthenticated users
│   │   └── Skeleton.jsx         Loading placeholder shapes
│   ├── hooks/
│   │   ├── usePlotNFT.js       usePlotOwner, usePlotTokenURI, useTotalSupply,
│   │   │                        usePlotOwners (batch), useMintPlot
│   │   ├── useMarketplace.js   useListing, useListings (batch), useCommissionRate,
│   │   │                        useListPlot, useBuyPlot, useDelistPlot, useUpdatePrice
│   │   ├── usePlotHistory.js   usePlotHistory (per-token events), useGlobalEvents
│   │   ├── usePinataMetadata.js usePinataMetadata, cidFromTokenURI, ipfsHttpUrl
│   │   ├── useRoles.js         useRoles → { isAdmin, isDealer, address, isConnected }
│   │   └── usePostHog.js       track(), PH_EVENTS constants
│   ├── lib/
│   │   ├── sectorLayout.js     Plot SVG coords + zone defs (source of truth for geometry)
│   │   └── pinata.js           Server-side Pinata SDK wrapper
│   └── constants/
│       └── contracts.js        ABIs + deployed addresses (import from here only)
├── .env.example        All required env vars documented
└── package.json        Root-level; frontend deps only (no Hardhat config)
```

---

## Commands

```bash
# Install
npm install

# Compile contracts → compile/output/
node compile/compile.js

# Deploy all three contracts to Sepolia (reads .env)
node deploy/deploy.js

# Seed: pins 24 plot metadata JSONs to Pinata, calls batchMint once for all 24 plots
node deploy/seed.js

# Dev server
cd frontend && npm run dev

# Production build
cd frontend && npm run build

# Lint
cd frontend && npm run lint
```

> **No test command exists in v1.** Do not add placeholder test scripts; they create false confidence.

---

## Environment Variables

All secrets in `.env` (deploy scripts) and `frontend/.env.local` (Next.js). Nothing sensitive is hardcoded anywhere.

| Variable | Used in | Purpose |
|----------|---------|---------|
| `PRIVATE_KEY` | `.env` | Admin wallet private key for deploy + seed scripts |
| `SEPOLIA_RPC_URL` | `.env` | Alchemy/Infura RPC endpoint for deploy + seed |
| `PINATA_JWT` | `frontend/.env.local` | Pinata write access — API route only, never browser |
| `PINATA_GATEWAY` | `frontend/.env.local` | Your dedicated Pinata gateway subdomain |
| `NEXT_PUBLIC_PLOT_NFT_ADDRESS` | `frontend/.env.local` | Deployed PlotNFT contract address |
| `NEXT_PUBLIC_MARKETPLACE_ADDRESS` | `frontend/.env.local` | Deployed PlotMarketplace contract address |
| `NEXT_PUBLIC_ROLE_MANAGER_ADDRESS` | `frontend/.env.local` | Deployed RoleManager contract address |
| `NEXT_PUBLIC_ADMIN_ADDRESS` | `frontend/.env.local` | Admin wallet address for frontend role checks |
| `NEXT_PUBLIC_DEPLOYMENT_BLOCK` | `frontend/.env.local` | Block number of marketplace deploy (for getLogs fromBlock) |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | `frontend/.env.local` | WalletConnect v2 project ID (RainbowKit) |
| `NEXT_PUBLIC_POSTHOG_KEY` | `frontend/.env.local` | PostHog project API key (optional) |
| `NEXT_PUBLIC_POSTHOG_HOST` | `frontend/.env.local` | PostHog ingestion host (default: us.i.posthog.com) |

`PINATA_JWT` must only appear in server-side code (`frontend/app/api/pinata/upload/route.js`). Any file prefixed `NEXT_PUBLIC_` is browser-visible — confirm no secrets use that prefix.

---

## Coding Conventions

**Contracts**
- Contract files: `PascalCase.sol`. Functions: `camelCase`. Events: `PascalCase`. Errors: `revert CustomError()` not `require(false, "string")`.
- All privileged functions call `RoleManager` first. Never inline role checks; always delegate to `roleManager.isAdmin(msg.sender)` or `roleManager.isDealer(msg.sender)`.
- Commission logic lives exclusively in `PlotMarketplace.sol:buyPlot`. Do not replicate it anywhere else.
- TokenIds start at 1 (override `_startTokenId()` to return 1). Plot tokenId == human-readable plot number.
- Per-token URIs stored in `mapping(uint256 => string) private _tokenURIs` inside `PlotNFT.sol`. `tokenURI()` reads from this mapping.

**Frontend**
- `hooks/` contains only chain reads and writes (wagmi/viem). Zero JSX allowed in hooks.
- `components/` contains only rendering. No direct contract calls; receive data as props or call hooks.
- `lib/sectorLayout.js` is the single source of truth for plot coordinates and zone geometry. Status fields in sectorLayout are mock/dev data — always overlay with live chain reads before rendering.
- `constants/contracts.js` exports ABI arrays and addresses. Import from here only. Never paste ABI inline in a component.
- Ownership history is always reconstructed from viem `getLogs` in `hooks/usePlotHistory.js`. Never store or fetch history from Pinata.
- Pinata metadata fetching goes through `hooks/usePinataMetadata.js` → `/api/pinata/metadata` → TanStack Query cache. Do not fetch IPFS directly in components.
- Error handling: contract call errors surface via wagmi's `error` return value and are displayed in the relevant component. Do not use `alert()` or `console.error` as user-facing error UI.
- TanStack Query global config: `staleTime: 30_000`, `refetchOnWindowFocus: false`. Per-query overrides only when the data has different staleness requirements.
- PostHog is initialised in `providers.jsx`. Track events using `track(PH_EVENTS.EVENT_NAME, payload)` from `hooks/usePostHog.js`. All event name constants live in `PH_EVENTS`.

---

## Things to Never Do

1. **Never import Hardhat or Foundry.** `compile/compile.js` uses `solc` npm package directly with a custom import-resolver callback that reads `node_modules/@openzeppelin/contracts/` and `node_modules/erc721a/contracts/`. Adding Hardhat breaks this deliberately minimal setup.

2. **Never skip the import-resolver callback in `compile/compile.js`.** solc-js does not auto-resolve node_modules imports. If the callback is missing, all OpenZeppelin and ERC-721A imports silently fail with `File not found`.

3. **Never call `ownerOf` in a loop on-chain.** ERC-721A's `ownerOf` walks backward through storage slots — it's O(n) in the worst case for tokens mid-batch. Fine for RPC reads; catastrophic in a contract loop.

4. **Never pin ownership history to Pinata.** History is live on-chain via `PlotSold` events. Pinning it creates a stale duplicate that diverges from the canonical chain state.

5. **Never use `NEXT_PUBLIC_` prefix for `PINATA_JWT`.** It would expose write keys to every browser visitor. The JWT must only appear in `frontend/app/api/pinata/upload/route.js`.

6. **Never mint from the frontend directly.** Minting goes through the admin dashboard's API route, which calls Pinata server-side first, then submits the mint transaction. Never send a tokenURI that isn't a resolved IPFS CID.

7. **Never modify `compile/output/` manually.** These files are generated by `compile.js`. Manual edits will be overwritten and can cause ABI/bytecode mismatches in deployment.

8. **Never mark Markaz, schools, masjids, parks, or apartment blocks as `tradeable: true` in `lib/sectorLayout.js`.** These zones render on the map but must never be mintable. The contract's `onlyAdmin` modifier won't protect against a mistaken seed run that mints them.

9. **Never call `getLogs` without `fromBlock: DEPLOYMENT_BLOCK`.** Scanning from genesis on every page load times out on public RPCs. Always use `NEXT_PUBLIC_DEPLOYMENT_BLOCK`.

10. **Never batch fewer than 100 or more than 100 plots per `batchMint` call in `seed.js` (if scaling beyond 24).** The current Paradise Valley has exactly 24 plots, so a single batchMint call covers all of them well under the gas limit.

11. **Never read live plot status from `sectorLayout.js`.** That file's `status` field is mock data for layout development. Always derive status from `usePlotOwners` + `useListings` before rendering the map.

---

## Open Questions / Known Weirdness

1. **ERC-721A `ownerOf` backward walk cost.** For tokens minted mid-batch, `ownerOf` may scan backward through storage slots. Acceptable for v1 RPC reads, but document this before adding any contract that calls `ownerOf` in a loop.

2. **No freeze mechanism on the contract yet.** The admin dashboard spec includes a "Freeze/unfreeze plot" tool, but `PlotNFT.sol` has no `freeze` function. This feature is planned but not yet written.

3. **Commission on primary sales — is the bypass always correct?** Admin sales to Dealers are designed to be commission-free because Admin would otherwise pay commission to itself. However, if Admin ever sells directly to an End User (bypassing Dealers entirely), the same bypass applies. It has not been decided whether Admin-to-User direct sales should be allowed, and if so, whether they should remain commission-free or attract a different rate.

4. **`useRoles` has an env-based admin fallback.** If `NEXT_PUBLIC_ADMIN_ADDRESS` matches the connected wallet, that wallet is treated as admin even if `RoleManager.isAdmin()` returns false. This is intentional for cases where the RoleManager contract address isn't configured, but it means admin access degrades gracefully rather than failing hard.

---

## Observability

PostHog is initialised in `frontend/app/providers.jsx` — it activates only when `NEXT_PUBLIC_POSTHOG_KEY` is set. Events are tracked via `track(PH_EVENTS.X, payload)` in hooks. Current tracked events: `WALLET_CONNECTED`, `PLOT_MINTED`, `PLOT_LISTED`, `PLOT_PURCHASED`, `PLOT_DELISTED`, `PLOT_PRICE_UPDATED`.

Sentry is **not yet installed**. Intended integration points: `frontend/app/layout.jsx` (server init) and `frontend/app/error.jsx` (client error boundary). Do not add Sentry without also wiring the error boundary.
