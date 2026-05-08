"use client";

import { useEffect, useState } from "react";
import { X, Loader2, ShieldCheck, ImageOff } from "lucide-react";
import { formatEther, parseEther } from "viem";

import { PLOT_BY_NUMBER } from "@/lib/sectorLayout";
import { deriveStatus } from "@/lib/plotStatus";
import { useRoles } from "@/hooks/useRoles";
import {
  usePlotOwner,
  usePlotTokenURI,
  useIsApprovedForAll,
  useSetApprovalForAll,
} from "@/hooks/usePlotNFT";
import {
  useListing,
  useBuyPlot,
  useListPlot,
  useDelistPlot,
  useUpdatePrice,
} from "@/hooks/useMarketplace";
import { MARKETPLACE_ADDRESS } from "@/constants/contracts";
import { usePinataMetadata } from "@/hooks/usePinataMetadata";
import { usePlotHistory } from "@/hooks/usePlotHistory";

import StatusBadge from "./StatusBadge";
import AddressPill from "./AddressPill";
import HistoryTimeline from "./HistoryTimeline";
import Skeleton from "./Skeleton";
import MintModal from "./MintModal";
import { useToast } from "./Toaster";

// Rough USD-per-ETH for the demo display (purely cosmetic).
const ETH_USD_RATE = 2470;

export default function PlotDetailPanel({ plotNumber, onClose }) {
  const plot = PLOT_BY_NUMBER[plotNumber];
  const { address, isAdmin } = useRoles();
  const { toast } = useToast();

  const { owner, isMinted, refetch: refetchOwner } = usePlotOwner(plotNumber);
  const { tokenURI } = usePlotTokenURI(plotNumber);
  const { listing, refetch: refetchListing } = useListing(plotNumber);
  const { metadata, isLoading: metaLoading } = usePinataMetadata(tokenURI);
  const { events, isLoading: histLoading, refetch: refetchHistory } =
    usePlotHistory(plotNumber);

  const status = deriveStatus({ owner, listing });
  const isOwner =
    address && owner && address.toLowerCase() === owner.toLowerCase();

  const [mintOpen, setMintOpen] = useState(false);
  const [listPrice, setListPrice] = useState("");
  const [editingPrice, setEditingPrice] = useState(false);
  const [newPriceInput, setNewPriceInput] = useState("");

  const buy = useBuyPlot();
  const list = useListPlot();
  const delist = useDelistPlot();
  const updatePrice = useUpdatePrice();

  useEffect(() => {
    if (
      buy.isSuccess ||
      list.isSuccess ||
      delist.isSuccess ||
      updatePrice.isSuccess
    ) {
      refetchOwner?.();
      refetchListing?.();
      refetchHistory?.();
    }
  }, [
    buy.isSuccess,
    list.isSuccess,
    delist.isSuccess,
    updatePrice.isSuccess,
    refetchOwner,
    refetchListing,
    refetchHistory,
  ]);

  useEffect(() => {
    [buy, list, delist, updatePrice].forEach((tx) => {
      if (tx.isError) {
        toast(
          tx.error?.shortMessage ?? tx.error?.message ?? "Transaction failed",
          { variant: "error" }
        );
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buy.isError, list.isError, delist.isError, updatePrice.isError]);

  useEffect(() => {
    if (buy.isSuccess) toast("Purchase confirmed", { variant: "success" });
    if (list.isSuccess) toast("Listing created", { variant: "success" });
    if (delist.isSuccess) toast("Listing removed", { variant: "success" });
    if (updatePrice.isSuccess) toast("Price updated", { variant: "success" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buy.isSuccess, list.isSuccess, delist.isSuccess, updatePrice.isSuccess]);

  if (!plot) return null;

  const priceEth = listing?.price ? formatEther(listing.price) : null;
  const priceUsd =
    priceEth != null
      ? Math.round(Number(priceEth) * ETH_USD_RATE).toLocaleString()
      : null;

  const heroImage = metadata?.imageUrl ?? null;

  return (
    <>
      <div className="fixed inset-0 z-[100] pointer-events-none">
        <button
          className="absolute inset-0 bg-black/30 pointer-events-auto"
          onClick={onClose}
          aria-label="Close panel"
        />
        <aside className="absolute right-0 top-16 h-[calc(100vh-64px)] w-full sm:w-[420px] bg-surface-container-lowest border-l border-outline-variant overflow-y-auto pointer-events-auto slide-in-right flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 border-b border-outline-variant flex items-start justify-between">
            <div>
              <h2 className="headline-md text-on-surface">
                Plot Details — {plot.id}
              </h2>
              <p className="label-technical text-primary mt-0.5">
                Paradise Valley
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-outline hover:text-on-surface transition p-1 -mr-1"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 px-6 py-5 space-y-6">
            {/* Hero image */}
            <div className="rounded-xl overflow-hidden border border-outline-variant bg-surface-container">
              {metaLoading && !metadata ? (
                <Skeleton className="w-full h-48" />
              ) : heroImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={heroImage}
                  alt={`Plot ${plot.plotNumber}`}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 flex flex-col items-center justify-center gap-2 bg-slate-50 text-slate-400">
                  <ImageOff size={28} />
                  <span className="text-xs font-medium uppercase tracking-wide">
                    No image on-chain
                  </span>
                </div>
              )}
            </div>

            {/* 2x2 info tiles */}
            <div className="grid grid-cols-2 gap-3">
              <InfoTile label="Size" value={plot.size} />
              <InfoTile
                label="Status"
                value={<StatusBadge status={status} />}
              />
              <InfoTile label="Street" value={plot.street} />
              <InfoTile label="Facing" value={plot.facing} />
            </div>

            {/* Owner */}
            <div>
              <p className="label-technical text-outline mb-2">Owner Address</p>
              {isMinted ? (
                <AddressPill address={owner} />
              ) : (
                <p className="text-sm text-outline">Not yet minted</p>
              )}
            </div>

            {/* Listing price */}
            {listing?.isActive && (
              <div className="flex justify-between items-end">
                <div>
                  <p className="label-technical text-outline mb-1">
                    Listing Price
                  </p>
                  <p className="display-lg text-on-surface">{priceEth} ETH</p>
                </div>
                {priceUsd && (
                  <p className="label-technical text-outline mb-1">
                    ≈ ${priceUsd}
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <Actions
              plot={plot}
              isMinted={isMinted}
              isOwner={isOwner}
              isAdmin={isAdmin}
              listing={listing}
              setMintOpen={setMintOpen}
              listPrice={listPrice}
              setListPrice={setListPrice}
              list={list}
              delist={delist}
              buy={buy}
              updatePrice={updatePrice}
              editingPrice={editingPrice}
              setEditingPrice={setEditingPrice}
              newPriceInput={newPriceInput}
              setNewPriceInput={setNewPriceInput}
              toast={toast}
              isConnected={Boolean(address)}
              address={address}
            />

            {/* History */}
            <div>
              <p className="label-technical text-outline mb-3">
                On-chain History
              </p>
              <HistoryTimeline events={events} isLoading={histLoading} />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-outline-variant bg-surface-container-low">
            <div className="flex items-center gap-2 label-technical text-outline">
              <ShieldCheck size={14} />
              <span>CDA Verified Ownership</span>
            </div>
          </div>
        </aside>
      </div>

      <MintModal
        open={mintOpen}
        onClose={() => setMintOpen(false)}
        plot={plot}
        onMinted={() => {
          setMintOpen(false);
          refetchOwner?.();
          refetchHistory?.();
        }}
      />
    </>
  );
}

function InfoTile({ label, value }) {
  return (
    <div className="p-3 bg-surface-container rounded-lg">
      <p className="label-technical text-outline mb-1.5">{label}</p>
      <div className="text-base font-bold text-on-surface">{value}</div>
    </div>
  );
}

function Actions({
  plot,
  isMinted,
  isOwner,
  isAdmin,
  listing,
  setMintOpen,
  listPrice,
  setListPrice,
  list,
  delist,
  buy,
  updatePrice,
  editingPrice,
  setEditingPrice,
  newPriceInput,
  setNewPriceInput,
  toast,
  isConnected,
  address,
}) {
  const { isApproved, isLoading: approvalLoading, refetch: refetchApproval } =
    useIsApprovedForAll(isOwner ? address : null, MARKETPLACE_ADDRESS);
  const approvalWrite = useSetApprovalForAll();

  useEffect(() => {
    if (approvalWrite.isSuccess) {
      toast("Marketplace approved", { variant: "success" });
      refetchApproval();
    }
    if (approvalWrite.isError) {
      toast(approvalWrite.error?.shortMessage ?? "Approval failed", { variant: "error" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approvalWrite.isSuccess, approvalWrite.isError]);

  if (!isConnected) {
    return (
      <button className="btn-outline w-full" disabled>
        Connect Wallet to Bid
      </button>
    );
  }

  if (!isMinted && isAdmin) {
    return (
      <button onClick={() => setMintOpen(true)} className="btn-primary w-full">
        Mint This Plot
      </button>
    );
  }
  if (!isMinted) {
    return (
      <p className="text-sm text-outline text-center py-2">
        This plot has not been minted yet. Only the admin can mint.
      </p>
    );
  }

  if (isOwner) {
    if (listing?.isActive) {
      return (
        <div className="space-y-3">
          {editingPrice ? (
            <div className="flex gap-2">
              <input
                className="input-base flex-1"
                type="number"
                step="0.0001"
                placeholder="New price (ETH)"
                value={newPriceInput}
                onChange={(e) => setNewPriceInput(e.target.value)}
              />
              <button
                className="btn-primary"
                disabled={updatePrice.isPending}
                onClick={() => {
                  if (!newPriceInput) return;
                  try {
                    updatePrice.run({
                      tokenId: plot.plotNumber,
                      newPrice: parseEther(newPriceInput),
                    });
                    setEditingPrice(false);
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
              <button
                className="btn-ghost"
                onClick={() => setEditingPrice(false)}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              className="btn-outline w-full"
              onClick={() => setEditingPrice(true)}
            >
              Edit Price
            </button>
          )}
          <button
            className="btn-ghost w-full text-error border-error/40 hover:border-error"
            disabled={delist.isPending}
            onClick={() => delist.run({ tokenId: plot.plotNumber })}
          >
            {delist.isPending ? "Delisting…" : "Delist"}
          </button>
        </div>
      );
    }

    // Not yet listed — show approval step first if needed
    if (!approvalLoading && !isApproved) {
      return (
        <div className="space-y-3">
          <p className="text-xs text-muted">
            Allow the marketplace to transfer your NFT when a buyer purchases it.
          </p>
          <button
            className="btn-primary w-full inline-flex items-center justify-center gap-2"
            disabled={approvalWrite.isPending}
            onClick={() =>
              approvalWrite.run({ operator: MARKETPLACE_ADDRESS, approved: true })
            }
          >
            {approvalWrite.isPending && <Loader2 size={14} className="animate-spin" />}
            Approve Marketplace
          </button>
        </div>
      );
    }

    return (
      <div className="flex gap-2">
        <input
          className="input-base flex-1"
          type="number"
          step="0.0001"
          placeholder="Price in ETH"
          value={listPrice}
          onChange={(e) => setListPrice(e.target.value)}
        />
        <button
          className="btn-primary"
          disabled={list.isPending || !listPrice}
          onClick={() => {
            try {
              list.run({
                tokenId: plot.plotNumber,
                price: parseEther(listPrice),
              });
            } catch {
              toast("Invalid price", { variant: "error" });
            }
          }}
        >
          {list.isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            "List for Sale"
          )}
        </button>
      </div>
    );
  }

  if (listing?.isActive) {
    return (
      <button
        className="btn-primary w-full inline-flex items-center justify-center gap-2"
        disabled={buy.isPending}
        onClick={() =>
          buy.run({ tokenId: plot.plotNumber, value: listing.price })
        }
      >
        {buy.isPending && <Loader2 size={14} className="animate-spin" />}
        Buy Now
      </button>
    );
  }

  return (
    <button className="btn-outline w-full" disabled>
      Make Offer (coming soon)
    </button>
  );
}
