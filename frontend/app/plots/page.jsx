"use client";

import { Suspense, useMemo, useState } from "react";
import { formatEther } from "viem";
import { Search } from "lucide-react";

import StatusBadge from "@/components/StatusBadge";
import AddressPill from "@/components/AddressPill";
import PlotDetailPanel from "@/components/PlotDetailPanel";
import { PlotThumb } from "@/components/PlotCard";

import { PLOTS, STREETS, FACINGS } from "@/lib/sectorLayout";
import { deriveStatus } from "@/lib/plotStatus";
import { usePlotOwners } from "@/hooks/usePlotNFT";
import { useListings } from "@/hooks/useMarketplace";
import { useRoles } from "@/hooks/useRoles";

const TOKEN_IDS = PLOTS.map((p) => p.plotNumber);

export default function PlotsPage() {
  return (
    <Suspense fallback={null}>
      <Directory />
    </Suspense>
  );
}

function Directory() {
  const { address } = useRoles();
  const { owners } = usePlotOwners(TOKEN_IDS);
  const { listings } = useListings(TOKEN_IDS);

  const [statusFilter, setStatusFilter] = useState("All");
  const [streetFilter, setStreetFilter] = useState("All");
  const [facingFilter, setFacingFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);

  const rows = useMemo(() => {
    return PLOTS.map((p) => {
      const owner = owners[p.plotNumber];
      const listing = listings[p.plotNumber];
      const status = deriveStatus({ owner, listing });
      return { plot: p, owner, listing, status };
    }).filter((r) => {
      if (statusFilter !== "All" && r.status !== statusFilter) return false;
      if (streetFilter !== "All" && r.plot.street !== streetFilter)
        return false;
      if (facingFilter !== "All" && r.plot.facing !== facingFilter)
        return false;
      if (query) {
        const q = query.toLowerCase();
        const hay = `${r.plot.plotNumber} ${r.plot.id} ${r.plot.street}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [owners, listings, statusFilter, streetFilter, facingFilter, query]);

  return (
    <div className="px-4 sm:px-6 py-8 max-w-7xl mx-auto space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-amber font-medium mb-1">
          Directory
        </p>
        <h1 className="text-3xl font-semibold">All Plots</h1>
        <p className="text-muted text-sm mt-1">
          Search and filter the {PLOTS.length} on-chain plots in Paradise Valley.
        </p>
      </header>

      <div className="card p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative col-span-1 sm:col-span-2 lg:col-span-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            className="input-dark pl-9"
            placeholder="Search plot…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={["All", "Available", "Listed", "Sold"]}
        />
        <Select
          label="Street"
          value={streetFilter}
          onChange={setStreetFilter}
          options={["All", ...STREETS]}
        />
        <Select
          label="Facing"
          value={facingFilter}
          onChange={setFacingFilter}
          options={["All", ...FACINGS]}
        />
      </div>

      {/* Desktop table */}
      <div className="card overflow-x-auto hidden md:block">
        <table className="w-full text-sm">
          <thead className="bg-surface-container text-muted text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left p-3 w-[72px]">Image</th>
              <th className="text-left p-3">Plot</th>
              <th className="text-left p-3">Block</th>
              <th className="text-left p-3">Street</th>
              <th className="text-left p-3">Facing</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Price</th>
              <th className="text-left p-3">Owner</th>
              <th className="text-left p-3" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="p-6 text-center text-muted">
                  No plots match your filters.
                </td>
              </tr>
            )}
            {rows.map(({ plot, owner, listing, status }) => (
              <tr key={plot.plotNumber} className="border-t border-border hover:bg-surface-container-low">
                <td className="p-3">
                  <PlotThumb tokenId={plot.plotNumber} size={48} />
                </td>
                <td className="p-3 font-semibold">#{plot.plotNumber}</td>
                <td className="p-3">{plot.block}</td>
                <td className="p-3">{plot.street}</td>
                <td className="p-3">{plot.facing}</td>
                <td className="p-3">
                  <StatusBadge status={status} />
                </td>
                <td className="p-3 text-amber">
                  {listing?.isActive ? `${formatEther(listing.price)} ETH` : "—"}
                </td>
                <td className="p-3">
                  {owner ? <AddressPill address={owner} /> : <span className="text-muted">—</span>}
                </td>
                <td className="p-3 text-right">
                  <div className="flex gap-1 justify-end">
                    {address && owner && owner.toLowerCase() === address.toLowerCase() && (
                      <button
                        className="btn-ghost text-xs text-amber"
                        onClick={() => setSelected(plot.plotNumber)}
                      >
                        List
                      </button>
                    )}
                    <button
                      className="btn-ghost text-xs"
                      onClick={() => setSelected(plot.plotNumber)}
                    >
                      View
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden grid gap-3">
        {rows.map(({ plot, owner, listing, status }) => (
          <div
            key={plot.plotNumber}
            onClick={() => setSelected(plot.plotNumber)}
            className="card p-4 text-left cursor-pointer flex gap-3"
          >
            <PlotThumb tokenId={plot.plotNumber} size={72} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <p className="text-lg font-semibold">#{plot.plotNumber}</p>
                <StatusBadge status={status} />
              </div>
              <p className="text-xs text-muted">
                Block {plot.block} · {plot.street} · {plot.facing}
              </p>
              <p className="text-amber text-sm mt-2">
                {listing?.isActive ? `${formatEther(listing.price)} ETH` : "—"}
              </p>
              {owner && <AddressPill address={owner} className="mt-2" />}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <PlotDetailPanel
          plotNumber={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wider text-muted block mb-1">
        {label}
      </span>
      <select
        className="input-dark"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
