"use client";

import { useEffect } from "react";
import {
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
} from "wagmi";
import { MARKETPLACE_ABI, MARKETPLACE_ADDRESS } from "@/constants/contracts";
import { track, PH_EVENTS } from "./usePostHog";

export function useListing(tokenId) {
  const { data, isLoading, refetch } = useReadContract({
    abi: MARKETPLACE_ABI,
    address: MARKETPLACE_ADDRESS,
    functionName: "getListingDetails",
    args: tokenId != null ? [BigInt(tokenId)] : undefined,
    query: { enabled: tokenId != null },
  });
  return {
    listing: data
      ? {
          seller: data.seller,
          price: data.price,
          isActive: data.isActive,
          listedAt: data.listedAt,
        }
      : null,
    isLoading,
    refetch,
  };
}

export function useListings(tokenIds = []) {
  const contracts = tokenIds.map((id) => ({
    abi: MARKETPLACE_ABI,
    address: MARKETPLACE_ADDRESS,
    functionName: "getListingDetails",
    args: [BigInt(id)],
  }));
  const { data, isLoading, refetch } = useReadContracts({
    contracts,
    allowFailure: true,
    query: { enabled: tokenIds.length > 0 },
  });
  const listings = {};
  tokenIds.forEach((id, i) => {
    const r = data?.[i];
    if (r && r.status === "success") {
      const v = r.result;
      listings[id] = {
        seller: v.seller,
        price: v.price,
        isActive: v.isActive,
        listedAt: v.listedAt,
      };
    } else {
      listings[id] = null;
    }
  });
  return { listings, isLoading, refetch };
}

export function useCommissionRate() {
  const { data } = useReadContract({
    abi: MARKETPLACE_ABI,
    address: MARKETPLACE_ADDRESS,
    functionName: "commissionRate",
  });
  return data != null ? Number(data) : null;
}

function useTrackedWrite(eventName) {
  const chainId = useChainId();
  const { writeContract: _write, data: hash, isPending, error, reset } =
    useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (receipt.isSuccess && hash && eventName) {
      track(eventName, { txHash: hash });
    }
  }, [receipt.isSuccess, hash, eventName]);

  const writeContract = (params) => _write({ chainId, ...params });

  return {
    writeContract,
    hash,
    isPending: isPending || receipt.isLoading,
    isSuccess: receipt.isSuccess,
    isError: Boolean(error) || receipt.isError,
    error: error || receipt.error,
    reset,
  };
}

export function useListPlot() {
  const w = useTrackedWrite(PH_EVENTS.PLOT_LISTED);
  const run = ({ tokenId, price }) =>
    w.writeContract({
      abi: MARKETPLACE_ABI,
      address: MARKETPLACE_ADDRESS,
      functionName: "listPlot",
      args: [BigInt(tokenId), BigInt(price)],
    });
  return { run, ...w };
}

export function useBuyPlot() {
  const w = useTrackedWrite(PH_EVENTS.PLOT_PURCHASED);
  const run = ({ tokenId, value }) =>
    w.writeContract({
      abi: MARKETPLACE_ABI,
      address: MARKETPLACE_ADDRESS,
      functionName: "buyPlot",
      args: [BigInt(tokenId)],
      value: BigInt(value),
    });
  return { run, ...w };
}

export function useDelistPlot() {
  const w = useTrackedWrite(PH_EVENTS.PLOT_DELISTED);
  const run = ({ tokenId }) =>
    w.writeContract({
      abi: MARKETPLACE_ABI,
      address: MARKETPLACE_ADDRESS,
      functionName: "delistPlot",
      args: [BigInt(tokenId)],
    });
  return { run, ...w };
}

export function useUpdatePrice() {
  const w = useTrackedWrite(PH_EVENTS.PLOT_PRICE_UPDATED);
  const run = ({ tokenId, newPrice }) =>
    w.writeContract({
      abi: MARKETPLACE_ABI,
      address: MARKETPLACE_ADDRESS,
      functionName: "updatePrice",
      args: [BigInt(tokenId), BigInt(newPrice)],
    });
  return { run, ...w };
}
