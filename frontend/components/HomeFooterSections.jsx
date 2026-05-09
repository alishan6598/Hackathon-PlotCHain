import Link from "next/link";
import {
  Sparkles,
  ShieldCheck,
  FileText,
  Wallet,
  MapPin,
  Receipt,
  ArrowUpRight,
  Layers,
  Lock,
  Globe2,
} from "lucide-react";

const WHATS_NEW = [
  {
    tag: "v1.0",
    date: "Live now",
    title: "Paradise Valley goes on-chain",
    body: "All 24 plots minted as ERC-721A NFTs on Sepolia. Ownership history is reconstructed live from on-chain events — no off-chain database.",
  },
  {
    tag: "Marketplace",
    date: "Live now",
    title: "Secondary sales with automatic commission",
    body: "List, buy and delist plots directly from your wallet. A 2% commission is routed to the registry on every non-admin sale, enforced in the contract.",
  },
  {
    tag: "v1.1",
    date: "Coming soon",
    title: "Dealer escrow & freeze controls",
    body: "Admin-side plot freeze, dealer escrow flows, and richer portfolio analytics are next on the roadmap.",
  },
];

const HOW_IT_WORKS = [
  {
    icon: Wallet,
    step: "01",
    title: "Connect your wallet",
    body: "Use any RainbowKit-compatible wallet on Sepolia. Your address determines whether you see the admin, dealer or buyer view.",
  },
  {
    icon: MapPin,
    step: "02",
    title: "Pick a plot on the map",
    body: "Click any sector tile to open its detail panel. Status, current owner and full provenance are read live from chain.",
  },
  {
    icon: Receipt,
    step: "03",
    title: "Buy, list or download a deed",
    body: "Buyers purchase from active listings. Owners list at any price. Every plot can produce a verifiable PDF certificate.",
  },
];

const TRUST_PILLARS = [
  {
    icon: ShieldCheck,
    title: "On-chain provenance",
    body: "Every transfer is a Transfer or PlotSold event. The history timeline is rebuilt from logs — never cached, never editable.",
  },
  {
    icon: Layers,
    title: "ERC-721A standard",
    body: "Plots are issued under Chiru Labs' ERC-721A — gas-efficient batch minting with full ERC-721 compatibility.",
  },
  {
    icon: Lock,
    title: "Role-gated actions",
    body: "Mint, freeze and dealer-only actions are guarded by RoleManager. Admin keys never leave the deployment wallet.",
  },
  {
    icon: Globe2,
    title: "IPFS-pinned metadata",
    body: "Plot images and metadata are pinned to IPFS via Pinata. tokenURI() resolves to an immutable CID per plot.",
  },
];

export default function HomeFooterSections() {
  return (
    <div className="border-t border-outline-variant bg-surface-container-lowest">
      {/* What's New */}
      <section className="px-6 md:px-10 py-12 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-on-surface">
            What's New
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {WHATS_NEW.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-outline-variant bg-surface p-5 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-primary/10 text-primary">
                  {item.tag}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-outline">
                  {item.date}
                </span>
              </div>
              <h3 className="text-base font-bold text-on-surface mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 md:px-10 py-12 max-w-7xl mx-auto border-t border-outline-variant">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-on-surface">
            How It Works
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {HOW_IT_WORKS.map(({ icon: Icon, ...item }) => (
            <div
              key={item.step}
              className="rounded-xl border border-outline-variant bg-surface p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-xs font-bold text-outline tracking-widest">
                  {item.step}
                </span>
              </div>
              <h3 className="text-base font-bold text-on-surface mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust & Transparency */}
      <section className="px-6 md:px-10 py-12 max-w-7xl mx-auto border-t border-outline-variant">
        <div className="flex items-center gap-2 mb-6">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-on-surface">
            Trust & Transparency
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {TRUST_PILLARS.map(({ icon: Icon, ...item }) => (
            <div
              key={item.title}
              className="rounded-xl border border-outline-variant bg-surface p-5"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-sm font-bold text-on-surface mb-1.5">
                {item.title}
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Resources / footer band */}
      <section className="px-6 md:px-10 py-10 border-t border-outline-variant bg-surface">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-sm font-bold text-on-surface">
              Paradise Valley · On-Chain Plot Registry
            </p>
            <p className="text-xs text-on-surface-variant mt-1">
              Sepolia testnet · ERC-721A · 2% commission on secondary sales
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/plots"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-primary text-on-primary hover:opacity-90 transition-opacity"
            >
              Browse all plots
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container transition-colors"
            >
              My portfolio
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
