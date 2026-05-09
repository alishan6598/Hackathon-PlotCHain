# PlotChain — Project Reflection

## What We Built

PlotChain is a blockchain-powered real estate marketplace built for Paradise Valley, a 24-plot residential development. Every plot is tokenized as an ERC-721A NFT on the Ethereum Sepolia testnet. The platform enables an Admin to mint and assign plots, Dealers to list them on the secondary market, and End Users to browse, buy, and hold verified ownership — all without a middleman or paper trail.

The centerpiece of the UI is an interactive SVG sector map. Every plot on the map reflects live on-chain state: unminted, available, listed for sale, or sold. Clicking a plot opens a slide-in panel with full ownership history reconstructed entirely from on-chain events — no database, no backend storage.

## Technical Decisions That Mattered

We deliberately avoided Hardhat and Foundry, opting instead for raw `solc-js` with a custom import-resolver callback. This kept the toolchain minimal and fully transparent. Three contracts work in concert — `RoleManager`, `PlotNFT`, and `PlotMarketplace` — with role checks always delegating to `RoleManager` rather than being inlined anywhere.

A 2% commission on every secondary sale is enforced at the smart contract level, not in application logic. This means it cannot be bypassed by a frontend change or a direct contract call. Pinata stores only immutable mint-time metadata; all ownership history lives on-chain and is read via `viem getLogs`. This was a conscious architectural choice to prevent stale data divergence.

## What Worked Well

The role-based access model came together cleanly. Admin, Dealer, and End User flows are properly separated with wallet-gated pages enforced by `RoleGuard`. The SVG map with live status overlay proved to be a compelling and intuitive UX — users can see the entire development at a glance and transact directly from the map panel. PDF certificate generation from on-chain data was a strong demo moment.

## What We'd Do Differently

The freeze/unfreeze mechanism for plots was designed but not implemented — a gap that would matter in a real deployment where disputes or legal holds are possible. Admin-to-User direct sales also lack a defined commission policy. Given more time, we would add on-chain plot freezing, a governance mechanism for commission rate changes, and mainnet deployment with a proper audit.

## Takeaway

PlotChain demonstrates that real estate tokenization does not require a complex Layer 2 or a centralized database. A small, well-scoped contract architecture with clean frontend hooks can deliver transparent, verifiable ownership with a consumer-grade user experience. The hardest problems were not the blockchain primitives — they were the UX decisions around surfacing on-chain state clearly to non-technical buyers.
