"use client";

import { useMemo, useState } from "react";
import { formatEther } from "viem";

import ConnectPrompt from "@/components/ConnectPrompt";
import PlotCard from "@/components/PlotCard";
import CertificateGenerator from "@/components/CertificateGenerator";
import PlotDetailPanel from "@/components/PlotDetailPanel";
import StatusBadge from "@/components/StatusBadge";
import AddressPill, { TxLink } from "@/components/AddressPill";

import { PLOTS } from "@/lib/sectorLayout";
import { useRoles } from "@/hooks/useRoles";
import { usePlotOwners } from "@/hooks/usePlotNFT";
import { useGlobalEvents } from "@/hooks/usePlotHistory";

const TOKEN_IDS = PLOTS.map((p) => p.plotNumber);

export default function DashboardPage() {
  const { address, isConnected } = useRoles();
  const { owners } = usePlotOwners(TOKEN_IDS);
  const { sold } = useGlobalEvents();
  const [selected, setSelected] = useState(null);

  const myPlots = useMemo(
    () =>
      PLOTS.filter(
        (p) =>
          address &&
          owners[p.plotNumber] &&
          owners[p.plotNumber].toLowerCase() === address.toLowerCase()
      ),
    [owners, address]
  );

  const myTxs = useMemo(() => {
    if (!address) return [];
    const lower = address.toLowerCase();
    return sold
      .filter(
        (s) =>
          s.seller.toLowerCase() === lower ||
          s.buyer.toLowerCase() === lower
      )
      .map((s) => ({
        ...s,
        action: s.buyer.toLowerCase() === lower ? "Bought" : "Sold",
        counterparty:
          s.buyer.toLowerCase() === lower ? s.seller : s.buyer,
      }));
  }, [sold, address]);

  // Last sale tx for each plot, used as the QR target on certificates.
  const lastTxByPlot = useMemo(() => {
    const map = {};
    sold
      .slice()
      .sort((a, b) => Number(a.blockNumber - b.blockNumber))
      .forEach((s) => {
        map[String(s.tokenId)] = s.txHash;
      });
    return map;
  }, [sold]);

  if (!isConnected) {
    return (
      <ConnectPrompt
        title="Your dashboard"
        message="Connect a wallet to see plots you own and your transaction history."
      />
    );
  }

  return (
    <div className="px-4 sm:px-6 py-8 max-w-7xl mx-auto space-y-10">
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-amber font-medium mb-1">
          Dashboard
        </p>
        <h1 className="text-3xl font-semibold">My Properties</h1>
      </header>

      {myPlots.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber/10 text-amber flex items-center justify-center mb-4 text-2xl">
            🏠
          </div>
          <h3 className="text-lg font-semibold mb-1">No properties yet</h3>
          <p className="text-muted text-sm">
            Browse the map to find your first plot.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {myPlots.map((plot) => (
            <PlotCard key={plot.plotNumber} plot={plot} status="Owned">
              <div className="space-y-2">
                <button
                  className="btn-amber w-full text-xs"
                  onClick={() => setSelected(plot.plotNumber)}
                >
                  List for Sale
                </button>
                <CertificateGenerator
                  plot={plot}
                  owner={address}
                  txHash={lastTxByPlot[String(plot.plotNumber)]}
                />
              </div>
            </PlotCard>
          ))}
        </div>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-amber rounded-full" />
          Transaction History
        </h2>
        {myTxs.length === 0 ? (
          <p className="card p-8 text-center text-sm text-muted">
            No transactions yet.
          </p>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-container text-muted text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left p-3">Action</th>
                  <th className="text-left p-3">Plot</th>
                  <th className="text-left p-3">Counterparty</th>
                  <th className="text-left p-3">Price</th>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Tx</th>
                </tr>
              </thead>
              <tbody>
                {myTxs.map((t, i) => (
                  <tr
                    key={`${t.txHash}-${i}`}
                    className="border-t border-border"
                  >
                    <td className="p-3">
                      <StatusBadge
                        status={t.action === "Bought" ? "Available" : "Sold"}
                      />
                      <span className="ml-2 text-xs text-muted">
                        {t.action}
                      </span>
                    </td>
                    <td className="p-3 font-semibold">#{Number(t.tokenId)}</td>
                    <td className="p-3">
                      <AddressPill address={t.counterparty} />
                    </td>
                    <td className="p-3 text-amber">
                      {formatEther(t.price)} ETH
                    </td>
                    <td className="p-3 text-muted">
                      {t.timestamp
                        ? new Date(t.timestamp * 1000).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="p-3">
                      <TxLink hash={t.txHash} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selected && (
        <PlotDetailPanel
          plotNumber={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
