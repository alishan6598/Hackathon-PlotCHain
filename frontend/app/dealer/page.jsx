"use client";

import { useEffect, useMemo, useState } from "react";
import { formatEther, parseEther } from "viem";
import { Loader2 } from "lucide-react";

import RoleGuard from "@/components/RoleGuard";
import Tabs from "@/components/Tabs";
import PlotCard, { PlotThumb } from "@/components/PlotCard";
import StatusBadge from "@/components/StatusBadge";
import AddressPill, { TxLink } from "@/components/AddressPill";
import { useToast } from "@/components/Toaster";

import { PLOTS } from "@/lib/sectorLayout";
import { useRoles } from "@/hooks/useRoles";
import { usePlotOwners } from "@/hooks/usePlotNFT";
import {
  useListings,
  useBuyPlot,
  useListPlot,
  useDelistPlot,
  useUpdatePrice,
} from "@/hooks/useMarketplace";
import { ADMIN_ADDRESS } from "@/constants/contracts";

const TOKEN_IDS = PLOTS.map((p) => p.plotNumber);

export default function DealerPage() {
  return (
    <RoleGuard role="dealer">
      <DealerDashboard />
    </RoleGuard>
  );
}

function DealerDashboard() {
  const { address } = useRoles();
  const { owners, refetch: refetchOwners } = usePlotOwners(TOKEN_IDS);
  const { listings, refetch: refetchListings } = useListings(TOKEN_IDS);

  const buyableFromAdmin = useMemo(
    () =>
      PLOTS.filter((p) => {
        const o = owners[p.plotNumber];
        const l = listings[p.plotNumber];
        return (
          o &&
          ADMIN_ADDRESS &&
          o.toLowerCase() === ADMIN_ADDRESS.toLowerCase() &&
          l?.isActive
        );
      }),
    [owners, listings]
  );

  const myPortfolio = useMemo(
    () =>
      PLOTS.filter((p) => {
        const o = owners[p.plotNumber];
        return (
          address && o && o.toLowerCase() === address.toLowerCase()
        );
      }),
    [owners, address]
  );

  const myListings = useMemo(
    () =>
      PLOTS.filter((p) => {
        const l = listings[p.plotNumber];
        return (
          address &&
          l?.isActive &&
          l.seller.toLowerCase() === address.toLowerCase()
        );
      }),
    [listings, address]
  );

  const [tab, setTab] = useState("buy");

  const refresh = () => {
    refetchOwners?.();
    refetchListings?.();
  };

  return (
    <div className="px-4 sm:px-6 py-8 max-w-7xl mx-auto space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-amber font-medium mb-1">
          Dealer
        </p>
        <h1 className="text-3xl font-semibold">Dealer Dashboard</h1>
      </header>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { value: "buy", label: "Buy from Admin", count: buyableFromAdmin.length },
          { value: "portfolio", label: "My Portfolio", count: myPortfolio.length },
          { value: "listings", label: "My Listings", count: myListings.length },
        ]}
      />

      {tab === "buy" && (
        <BuyTab plots={buyableFromAdmin} listings={listings} onTxDone={refresh} />
      )}
      {tab === "portfolio" && (
        <PortfolioTab plots={myPortfolio} listings={listings} onTxDone={refresh} />
      )}
      {tab === "listings" && (
        <ListingsTab plots={myListings} listings={listings} onTxDone={refresh} />
      )}
    </div>
  );
}

function BuyTab({ plots, listings, onTxDone }) {
  const { toast } = useToast();
  const buy = useBuyPlot();

  useEffect(() => {
    if (buy.isSuccess) {
      toast("Purchase confirmed ✓", { variant: "success" });
      onTxDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buy.isSuccess]);
  useEffect(() => {
    if (buy.isError)
      toast(buy.error?.shortMessage ?? buy.error?.message ?? "Buy failed", {
        variant: "error",
      });
  }, [buy.isError, buy.error, toast]);

  if (plots.length === 0) {
    return (
      <EmptyState
        title="Nothing on offer"
        message="The admin has no plots listed for sale right now."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {plots.map((plot) => {
        const listing = listings[plot.plotNumber];
        return (
          <PlotCard
            key={plot.plotNumber}
            plot={plot}
            status="Listed"
            priceLabel={`${formatEther(listing.price)} ETH`}
          >
            <button
              className="btn-amber w-full inline-flex items-center justify-center gap-2"
              disabled={buy.isPending}
              onClick={() =>
                buy.run({ tokenId: plot.plotNumber, value: listing.price })
              }
            >
              {buy.isPending && <Loader2 size={14} className="animate-spin" />}
              Buy
            </button>
          </PlotCard>
        );
      })}
    </div>
  );
}

function PortfolioTab({ plots, listings, onTxDone }) {
  if (plots.length === 0) {
    return (
      <EmptyState
        title="No plots yet"
        message="Buy from the admin to start your portfolio."
      />
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {plots.map((plot) => (
        <PortfolioCard
          key={plot.plotNumber}
          plot={plot}
          listing={listings[plot.plotNumber]}
          onTxDone={onTxDone}
        />
      ))}
    </div>
  );
}

function PortfolioCard({ plot, listing, onTxDone }) {
  const { toast } = useToast();
  const list = useListPlot();
  const [price, setPrice] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (list.isSuccess) {
      toast("Listed for sale ✓", { variant: "success" });
      onTxDone();
      setEditing(false);
      setPrice("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.isSuccess]);
  useEffect(() => {
    if (list.isError)
      toast(list.error?.shortMessage ?? list.error?.message, {
        variant: "error",
      });
  }, [list.isError, list.error, toast]);

  return (
    <PlotCard
      plot={plot}
      status={listing?.isActive ? "Listed" : "Owned"}
      priceLabel={
        listing?.isActive ? `${formatEther(listing.price)} ETH` : null
      }
    >
      {listing?.isActive ? (
        <p className="text-xs text-muted">Already listed for sale.</p>
      ) : editing ? (
        <div className="flex gap-2">
          <input
            className="input-dark flex-1"
            type="number"
            step="0.0001"
            placeholder="Price (ETH)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <button
            className="btn-amber"
            disabled={list.isPending || !price}
            onClick={() => {
              try {
                list.run({
                  tokenId: plot.plotNumber,
                  price: parseEther(price),
                });
              } catch {
                toast("Invalid price", { variant: "error" });
              }
            }}
          >
            {list.isPending ? <Loader2 size={14} className="animate-spin" /> : "Confirm"}
          </button>
          <button className="btn-ghost" onClick={() => setEditing(false)}>
            Cancel
          </button>
        </div>
      ) : (
        <button className="btn-ghost w-full" onClick={() => setEditing(true)}>
          List for Resale
        </button>
      )}
    </PlotCard>
  );
}

function ListingsTab({ plots, listings, onTxDone }) {
  const { toast } = useToast();
  const delist = useDelistPlot();
  const updatePrice = useUpdatePrice();
  const [editId, setEditId] = useState(null);
  const [newPrice, setNewPrice] = useState("");

  useEffect(() => {
    if (delist.isSuccess) {
      toast("Delisted ✓", { variant: "success" });
      onTxDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delist.isSuccess]);
  useEffect(() => {
    if (updatePrice.isSuccess) {
      toast("Price updated ✓", { variant: "success" });
      setEditId(null);
      setNewPrice("");
      onTxDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updatePrice.isSuccess]);
  useEffect(() => {
    if (delist.isError)
      toast(delist.error?.shortMessage ?? delist.error?.message, {
        variant: "error",
      });
    if (updatePrice.isError)
      toast(updatePrice.error?.shortMessage ?? updatePrice.error?.message, {
        variant: "error",
      });
  }, [delist.isError, delist.error, updatePrice.isError, updatePrice.error, toast]);

  if (plots.length === 0) {
    return <EmptyState title="No active listings" message="List a plot from your portfolio." />;
  }

  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-surface-container text-muted text-xs uppercase tracking-wider">
          <tr>
            <th className="text-left p-3 w-[72px]">Image</th>
            <th className="text-left p-3">Plot</th>
            <th className="text-left p-3">Price</th>
            <th className="text-left p-3">Listed</th>
            <th className="text-left p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {plots.map((p) => {
            const l = listings[p.plotNumber];
            return (
              <tr key={p.plotNumber} className="border-t border-border">
                <td className="p-3">
                  <PlotThumb tokenId={p.plotNumber} size={48} />
                </td>
                <td className="p-3 font-semibold">#{p.plotNumber}</td>
                <td className="p-3">
                  {editId === p.plotNumber ? (
                    <div className="flex gap-2">
                      <input
                        className="input-dark"
                        type="number"
                        step="0.0001"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                      />
                      <button
                        className="btn-amber"
                        disabled={updatePrice.isPending || !newPrice}
                        onClick={() => {
                          try {
                            updatePrice.run({
                              tokenId: p.plotNumber,
                              newPrice: parseEther(newPrice),
                            });
                          } catch {
                            toast("Invalid price", { variant: "error" });
                          }
                        }}
                      >
                        {updatePrice.isPending ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          "Save"
                        )}
                      </button>
                    </div>
                  ) : (
                    <span className="text-amber">
                      {formatEther(l.price)} ETH
                    </span>
                  )}
                </td>
                <td className="p-3 text-muted">
                  {l.listedAt
                    ? new Date(Number(l.listedAt) * 1000).toLocaleDateString()
                    : "—"}
                </td>
                <td className="p-3 flex gap-2">
                  {editId !== p.plotNumber && (
                    <button
                      className="btn-ghost text-xs"
                      onClick={() => {
                        setEditId(p.plotNumber);
                        setNewPrice(formatEther(l.price));
                      }}
                    >
                      Edit Price
                    </button>
                  )}
                  <button
                    className="btn-ghost text-xs text-danger border-danger/40"
                    disabled={delist.isPending}
                    onClick={() => delist.run({ tokenId: p.plotNumber })}
                  >
                    Delist
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ title, message }) {
  return (
    <div className="card p-12 text-center">
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-muted text-sm">{message}</p>
    </div>
  );
}
