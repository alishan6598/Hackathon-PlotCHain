# PlotChain — CLAUDE.md

## What This Is

Blockchain real estate marketplace for Sector C-14, Islamabad (641 plots). Every plot is an ERC-721A NFT. Secondary-market sales auto-deduct 2% commission to admin via smart contract. Three roles: Admin, Dealer, End User. Homepage is a clickable SVG sector map; click any plot to see full on-chain ownership history.

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
| Pan/zoom | react-zoom-pan-pinch | latest |
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
                       │
          frontend/components/HistoryTimeline.jsx
                       │
          frontend/app/page.jsx (SectorMap)
                Pinata gateway
          ← tokenURI → ipfs://<CID> → plot metadata JSON
```

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
│   ├── seed.js         pin demo metadata to Pinata + call batchMint in chunks
│   └── plotData.json   641-plot definitions for seeding
├── frontend/
│   ├── app/            Next.js App Router pages + API routes
│   ├── components/     Pure UI: SectorMap, PlotDetailPanel, HistoryTimeline, etc.
│   ├── hooks/          Chain reads only: usePlotNFT, useMarketplace, usePlotHistory
│   ├── lib/            pinata.js wrapper, sectorLayout.js (plot coords + zones)
│   └── constants/      contracts.js — ABIs + deployed addresses (source of truth)
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

# Seed demo plots: pins metadata to Pinata, calls batchMint in ~7 chunks
node deploy/seed.js

# Dev server
cd frontend && npm run dev

# Production build
cd frontend && npm run build

# Lint
cd frontend && npm run lint

# No automated tests for v1 — verification is manual via demo flow
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
- `lib/sectorLayout.js` is the single source of truth for plot coordinates, zone types, and `tradeable` flags. Do not hardcode plot positions in components.
- `constants/contracts.js` exports ABI arrays and addresses. Import from here only. Never paste ABI inline in a component.
- Ownership history is always reconstructed from viem `getLogs` in `hooks/usePlotHistory.js`. Never store or fetch history from Pinata.
- Pinata metadata fetching goes through `hooks/usePinataMetadata.js` → TanStack Query cache. Do not fetch IPFS directly in components.
- Error handling: contract call errors surface via wagmi's `error` return value and are displayed in the relevant component. Do not use `alert()` or `console.error` as user-facing error UI.

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

10. **Never batch fewer than 100 or more than 100 plots per `batchMint` call in `seed.js`.** Under 100 wastes transactions; over 100 risks hitting Sepolia's ~30M gas block limit with 641 tokenURIs as calldata.

---

## Open Questions / Known Weirdness

1. **ERC-721A `ownerOf` backward walk cost.** For tokens minted mid-batch (e.g., token 450 in a 641-plot batch), `ownerOf` may scan up to 450 storage slots. Acceptable for v1 RPC reads, but document this before adding any contract that calls `ownerOf` in a loop.

2. **SVG performance at 641 plots.** The full sector map renders all 641 `<PlotShape>` elements. At high zoom-out this can cause jank. The context says to defer full sector to v1.1, but the codebase ships with `sectorLayout.js` containing all 641 entries. A future dev may try to render all of them and wonder why it's slow — viewport culling is not yet implemented.

3. **30 odd-shaped plots have no defined polygon coordinates yet.** `PlotShape.jsx` branches on `plot.type === 'odd'` and renders a `<polygon>` — but `plotData.json` for v1 demo only covers Block 1 (plots 1–14), which are all rectangular. The polygon coordinate format for odd plots is specified but not yet populated. Don't assume all entries in `plotData.json` are complete.

4. **Commission rate is set at deploy time with no upgrade path.** `PlotMarketplace.sol` stores `commissionRate` as a state variable readable by admin, but there is no `setCommissionRate` function defined in the context. Either it exists and wasn't documented, or rate changes require redeployment. Verify before shipping.

5. **No freeze mechanism on the contract yet.** The admin dashboard spec includes a "Freeze/unfreeze plot" tool, but `PlotNFT.sol` in the context has no `freeze` function. This feature is either planned but not yet written, or needs to be added before the admin dashboard component can work.

---

## Observability

**Not yet configured for v1.** The following are the intended integration points when added:

- **Sentry:** Initialize in `frontend/app/layout.jsx` (server) and `frontend/app/error.jsx` (client error boundary). Capture unhandled wagmi transaction errors in `hooks/useMarketplace.js` catch blocks.
- **PostHog:** Initialize in `frontend/app/layout.jsx`. Track: `plot_viewed` (plot detail panel open), `plot_purchased` (buyPlot tx confirmed), `certificate_downloaded`, `wallet_connected`.
- Neither tool is installed in v1. Do not add them without also wiring the error boundary in `app/error.jsx`.