# PlotChain — Product Specification

---

## 1. Project Overview

PlotChain is a digital marketplace for buying and selling residential plots in planned communities like Paradise Valley. Every plot in the community has a permanent digital record that tracks who owns it, who owned it before, what it sold for, and when. Buyers can browse an interactive map of the entire community, click any plot to see its full ownership history, purchase it directly through the platform, and receive an official digital certificate proving their ownership. The platform is designed for three parties: the community authority (Admin), licensed property dealers, and individual buyers. It removes paper files entirely — ownership is recorded on a public ledger that no one can alter, fake, or duplicate.

---

## 2. Problem Statement

Real estate in planned communities worldwide runs almost entirely on paper files and manual registry. This creates four chronic, costly problems:

**Fake files.** A seller can produce a forged ownership document for a plot they do not own. Buyers have no reliable way to verify authenticity without expensive legal due diligence. Disputes can take years to resolve in court.

**Double-selling.** The same plot is sold to two different buyers simultaneously, each receiving a "valid" paper file. One buyer loses their entire investment with little legal recourse against an absconded seller.

**Commission disputes.** Dealers and agents operate on verbal agreements. When a plot changes hands, commission amounts are contested, withheld, or simply never paid. There is no automated enforcement.

**Zero transparency.** A buyer cannot independently verify the price a plot last sold for, how many times it has changed hands, or whether it is currently encumbered. All of this information is gated behind brokers and registry offices.

**Who suffers:** Individual buyers (often investing life savings), legitimate dealers operating in good faith, and the community authority who cannot enforce policies without a reliable ownership record.

---

## 3. User Roles

### Admin — The Community Authority

**Who they are:** The official body that owns and governs the community (e.g. a housing society, development authority). There is exactly one Admin account per community.

**What they can do:**
- Register new plots and publish them to the marketplace
- Publish all 24 plots of the community in a single bulk action
- Set the commission rate applied to all dealer and user resales
- Add or remove licensed dealers from the platform
- View every transaction that has ever occurred across all plots
- Freeze a disputed plot so it cannot be traded until resolved

**What they cannot do:**
- Buy or resell plots (Admin only sells from inventory, never purchases)
- Pay commission on their own sales (Admin-to-anyone sales are commission-free)
- Transfer their Admin role to another account

---

### Dealer — The Licensed Agent

**Who they are:** A property dealer or agency that has been approved by the Admin. They act as intermediaries — buying plots from the Admin's inventory and reselling them to end buyers.

**What they can do:**
- Browse and purchase available plots directly from Admin inventory
- List owned plots for resale at a price they set
- Update the asking price on their listings
- Remove a listing without selling
- View their own portfolio, purchase history, and net profit

**What they cannot do:**
- Operate on the platform until the Admin has approved their account
- Buy from other Dealers or End Users through the platform (Dealer-to-Dealer sales are not supported in v1)
- Avoid the automatic commission deduction when reselling

---

### End User — The Individual Buyer

**Who they are:** A private individual purchasing a plot for personal use or investment. No prior approval is needed — anyone with a digital wallet can browse and buy.

**What they can do:**
- Browse the full sector map and all plot listings without creating an account
- Buy a plot from a Dealer or from another End User
- Resell an owned plot to another User or Dealer
- View the complete ownership history of any plot
- Download an official PDF ownership certificate for any plot they own

**What they cannot do:**
- List a plot they do not own
- Buy directly from Admin inventory (only Dealers can buy primary Admin stock)
- Bypass the automatic commission deduction on resale

---

## 4. Core Features — MVP Scope

### Sector Map
- The homepage displays a full overhead map of Paradise Valley (24 plots) as an interactive visual grid arranged in 2 rows of 12 plots (Street A and Street B).
- Every plot is colour-coded: green (available), yellow (listed for resale), red (owned, not for sale), grey (non-tradeable zones such as parks, mosques, schools).
- Hovering a plot shows its plot number, current owner, and price if listed.
- Clicking a plot opens a side panel with full details, ownership history, and any available action buttons.
- A search bar lets any visitor jump directly to a plot by its number (e.g. PV-17).
- Non-tradeable amenity zones (Central Park, Masjid, School, Hospital, Markaz commercial) are visible on the map but cannot be interacted with.

### Plot Management
- Admin can register a single plot by filling in its details and publishing it.
- Admin can register all 641 plots of the sector in one bulk action.
- Each plot has a permanent record including plot number, size, street, type, facing, and location in the sector grid.
- Admin can freeze or unfreeze any plot to block trading during a dispute.

### Marketplace
- Admin can list plots from their inventory for Dealer purchase.
- Dealers can list owned plots for resale to End Users and other Users.
- Buyers can purchase a listed plot with a single confirmation action.
- On every non-Admin sale, the platform automatically deducts the commission and routes it to the Admin — no manual step required.
- On Admin sales, the full price goes to Admin with no commission deducted.
- Sellers can update the price or remove a listing at any time before it sells.

### Ownership & History
- Every plot has a public ownership history showing every past owner, sale price, commission paid, and the date of each transfer.
- The ownership record is permanent and cannot be edited or deleted by anyone.
- Each entry in the history links to the publicly verifiable transaction record.
- The current owner of any plot is always visible to any visitor, no account required.

### PDF Ownership Certificate
- Any owner can download a PDF certificate for a plot they own.
- The certificate shows: plot ID, size, type, location, owner's account address, purchase date, purchase price, and transaction reference.
- The certificate includes a QR code that links to the plot's public record for instant verification.

### Role Management
- Admin can add a wallet address as an approved Dealer.
- Admin can revoke a Dealer's approval at any time.
- Role-restricted pages (Admin dashboard, Dealer dashboard) are only accessible to the correct account — all others see an access-denied screen.
- Sector map and plot details are fully visible to unauthenticated visitors.

---

## 5. User Flows

### Admin mints a new plot
1. Admin connects their wallet and navigates to the Admin Dashboard.
2. Admin selects "Register Plot" and fills in the plot's details: plot number, size, street, type, and facing.
3. Admin submits the form.
4. The plot appears on the sector map in green and in the Admin's available inventory.

### Dealer buys a plot from Admin
1. Dealer connects their whitelisted wallet.
2. Dealer browses Admin inventory and clicks a plot they want to purchase.
3. The detail panel opens showing the price. Dealer clicks "Buy."
4. Dealer confirms the payment in their wallet. No commission is applied.
5. Plot transfers to Dealer. Map colour updates. Plot appears in Dealer's portfolio.

### Dealer lists a plot for resale
1. Dealer navigates to their dashboard and selects a plot they own.
2. Dealer clicks "List for Resale" and enters their asking price.
3. Dealer confirms in their wallet.
4. Plot appears on the sector map in yellow and is visible to all visitors as available for purchase.

### End User buys a plot from Dealer
1. User connects their wallet and clicks a yellow plot on the sector map.
2. The detail panel shows the asking price and the automatic commission breakdown.
3. User clicks "Buy" and confirms the payment in their wallet.
4. Commission is automatically sent to Admin; the remainder goes to the Dealer. No manual step.
5. Plot transfers to User. Map colour updates to red. Plot appears in User's dashboard.

### End User downloads ownership certificate
1. User navigates to their dashboard and selects an owned plot.
2. User clicks "Download Certificate."
3. A PDF certificate is generated and downloaded immediately — no email, no waiting.

### End User resells a plot to another User
1. User navigates to their dashboard, selects an owned plot, and clicks "List for Resale."
2. User sets an asking price and confirms in their wallet.
3. Another User finds the plot on the map, clicks Buy, and confirms payment.
4. Commission is automatically sent to Admin; remainder goes to the original seller.
5. Ownership transfers. Both parties' dashboards update.

---

## 6. Data Model

### Plot
The fundamental unit of the marketplace. Represents one physical plot of land in the sector.

**Key attributes:** Plot ID (e.g. PV-17), size (e.g. 50×90 ft), area in Kanal, street number, plot type (normal / corner), facing direction, grid position on the community map, tradeable flag, mint date.

**Relationships:** A Plot has one current Owner. A Plot has many Transactions in its history. A Plot may have one active Listing at a time.

---

### Listing
Represents a plot that has been put up for sale by its current owner.

**Key attributes:** Which plot is listed, the seller's identity, the asking price, whether it is currently active, and when it was listed.

**Relationships:** A Listing belongs to one Plot. A Listing is created by one Owner (Admin, Dealer, or User). A Listing results in at most one Transaction when purchased.

---

### Transaction
A permanent record of a completed sale. Created automatically every time a plot changes hands. Cannot be modified or deleted.

**Key attributes:** Which plot was sold, who sold it, who bought it, the sale price, the commission amount (zero for Admin sales), and the date and time of the transfer.

**Relationships:** A Transaction belongs to one Plot. Each Transaction references a Buyer and a Seller. Transactions form the ownership history of a Plot.

---

### Role
Defines what a wallet address is allowed to do on the platform.

**Key attributes:** Wallet address, role type (Admin / Dealer / End User), whether the role is currently active, and who granted it.

**Relationships:** One Admin exists per sector and cannot be changed. A Dealer role is granted by Admin and can be revoked. End User is the default role for any connected wallet with no explicit assignment.

---

## 7. Out of Scope for v1

- **Mainnet deployment** — the platform runs on a public test network only; no real money is at risk.
- **Mobile app** — no iOS or Android application; the web interface must be usable on mobile browsers but is not a native app.
- **Fiat payments** — no credit card, bank transfer, or other fiat integration; all transactions use cryptocurrency only.
- **Backend database or indexer** — no server-side database; all ownership records are read directly from the public ledger.
- **Multi-society support** — only Paradise Valley is supported; adding additional communities is a future milestone.
- **Plot subdivision** — a plot cannot be split into smaller units or co-owned by multiple parties.
- **Mortgage and installment plans** — no partial payment, instalment schedule, or financing mechanism.
- **KYC and identity verification** — the platform does not verify the real-world identity of any user; it operates on wallet addresses only.
- **Dispute resolution system** — Admin can freeze a plot but there is no built-in arbitration, evidence submission, or case management workflow.
- **Secondary market between Dealers** — Dealer-to-Dealer plot sales are not supported in v1.
- **Notification system** — no email, SMS, or push notifications for any event.

---

## 8. Open Questions

**1. Commission rate — when does a rate change take effect?**
The Admin can update the commission rate. It is not decided whether a rate change affects only future listings or also listings that are already active. If a plot is listed at a 2% commission rate and the rate changes to 3% before it sells, which rate applies? This needs a policy decision before the marketplace is launched.

**2. Plot freeze — what exactly does freezing block?**
Admin can freeze a disputed plot to stop trading. The scope of the freeze is not fully defined: does it only block new purchases, or does it also automatically delist the plot? Can the owner still transfer it outside the marketplace while it is frozen? The freeze behaviour needs to be specified before the admin dashboard dispute tool is built.

**3. Commission on primary sales — is the bypass always correct?**
Admin sales to Dealers are designed to be commission-free because Admin would otherwise pay commission to itself. However, if Admin ever sells directly to an End User (bypassing Dealers entirely), the same bypass applies. It has not been decided whether Admin-to-User direct sales should be allowed, and if so, whether they should remain commission-free or attract a different rate.

**4. PDF certificate — is it legally recognised?**
The ownership certificate is designed to look like an official document and includes a verifiable QR code. It has not been decided whether the certificate will carry any legal disclaimer, whether it should include the society's official branding, or what language (Urdu / English) it should be printed in.

**5. Wallet-free browsing — what is the fallback for unresolved plot owners?**
Plot detail panels show the current owner's wallet address. For visitors without any blockchain knowledge, a truncated hex address is meaningless. It has not been decided whether to show a display name, mask the address, or leave it as-is with a tooltip explaining what it means.
