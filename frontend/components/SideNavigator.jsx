"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  Home as HomeIcon,
  Map,
  Wallet,
  ShieldCheck,
  Briefcase,
  BarChart3,
  Download,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useRoles } from "@/hooks/useRoles";
import { PLOTS } from "@/lib/sectorLayout";
import { usePlotOwners } from "@/hooks/usePlotNFT";
import { useListings } from "@/hooks/useMarketplace";

const ICON = {
  Home: HomeIcon,
  Plots: Map,
  "My Portfolio": Wallet,
  Dashboard: BarChart3,
  Admin: ShieldCheck,
  Dealer: Briefcase,
};

export default function SideNavigator() {
  const pathname = usePathname();
  const { isAdmin, isDealer } = useRoles();

  const tokenIds = PLOTS.map(p => p.tokenId);
  const adminAddress = process.env.NEXT_PUBLIC_ADMIN_ADDRESS?.toLowerCase();
  const { owners } = usePlotOwners(tokenIds);
  const { listings } = useListings(tokenIds);

  let available = 0, listed = 0, sold = 0;
  for (const id of tokenIds) {
    const owner = owners[id]?.toLowerCase();
    const listing = listings[id];
    if (!owner) continue; // unminted — not counted
    if (listing?.isActive) listed++;
    else if (owner === adminAddress) available++;
    else sold++;
  }

  const stats = {
    total: PLOTS.length,
    available,
    listed,
    sold,
  };

  const links = [
    { href: "/", label: "Home" },
    { href: "/plots", label: "Plots" },
    { href: "/dashboard", label: "My Portfolio" },
    isAdmin && { href: "/admin", label: "Admin Panel" },
    (isDealer || isAdmin) && { href: "/dealer", label: "Dealer Portal" },
  ].filter(Boolean);

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-16 bottom-0 z-40 w-[300px] overflow-y-auto bg-gradient-to-b from-slate-50 to-white border-r border-slate-200">
      <div className="p-5 space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900">Paradise Valley</h2>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            On-Chain Real Estate
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Available"
            value={stats.available}
            color="bg-emerald-50 text-emerald-700 border-emerald-200"
            icon="🟢"
          />
          <StatCard
            label="Listed"
            value={stats.listed}
            color="bg-amber-50 text-amber-700 border-amber-200"
            icon="🟠"
          />
          <StatCard
            label="Sold"
            value={stats.sold}
            color="bg-rose-50 text-rose-700 border-rose-200"
            icon="🔴"
          />
          <StatCard
            label="Total"
            value={stats.total}
            color="bg-slate-100 text-slate-700 border-slate-300"
            icon="📊"
          />
        </div>

        {/* Network & Commission Info */}
        <div className="space-y-2">
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-900">Network</span>
              <span className="px-2 py-1 text-xs font-mono bg-white border border-blue-200 rounded text-blue-700">
                Sepolia
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-900">Commission</span>
              <span className="px-2 py-1 text-xs font-mono bg-white border border-blue-200 rounded text-blue-700">
                2%
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {links.map((l) => {
            const Icon = ICON[l.label] ?? Map;
            const baseHref = l.href.split("?")[0];
            const active =
              baseHref === "/"
                ? pathname === "/"
                : pathname?.startsWith(baseHref);
            return (
              <Link
                key={l.href + l.label}
                href={l.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold text-sm transition-all duration-150 ${
                  active
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Icon size={18} />
                {l.label}
              </Link>
            );
          })}
        </nav>

        {/* Market Insights */}
        <div className="space-y-2 pt-2 border-t border-slate-200">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest">
            Market Insights
          </p>
          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex items-center justify-between p-2 rounded bg-slate-50">
              <span className="flex items-center gap-2">
                <TrendingUp size={14} className="text-blue-600" />
                Turnover Rate
              </span>
              <span className="font-semibold text-slate-900">
                {Math.round((stats.sold / stats.total) * 100)}%
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-50">
              <span className="flex items-center gap-2">
                <Zap size={14} className="text-amber-600" />
                Active Listings
              </span>
              <span className="font-semibold text-slate-900">
                {stats.listed}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="mt-auto p-5">
        <button
          type="button"
          onClick={() => window.print()}
          className="w-full py-4 px-4 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl border border-blue-800 flex items-center justify-between group hover:shadow-lg transition-all duration-200"
        >
          <div className="text-left">
            <p className="text-xs font-semibold uppercase tracking-widest mb-0.5 opacity-90">
              Download
            </p>
            <p className="font-bold text-sm">Official Layout Plan</p>
          </div>
          <Download size={18} className="group-hover:translate-y-1 transition-transform" />
        </button>
      </div>
    </aside>
  );
}

function StatCard({ label, value, color, icon }) {
  return (
    <div className={`rounded-lg border p-3 text-center ${color}`}>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs font-semibold">{label}</div>
    </div>
  );
}
