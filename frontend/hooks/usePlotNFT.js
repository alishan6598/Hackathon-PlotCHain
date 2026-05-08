"use client";

import { useEffect } from "react";
import {
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
} from "wagmi";
import { PLOT_NFT_ABI, PLOT_NFT_ADDRESS } from "@/constants/contracts";
import { track, PH_EVENTS } from "./usePostHog";

export function usePlotOwner(tokenId) {
  const { data, isLoading, error, refetch } = useReadContract({
    abi: PLOT_NFT_ABI,
    address: PLOT_NFT_ADDRESS,
    functionName: "ownerOf",
    args: tokenId != null ? [BigInt(tokenId)] : undefined,
    query: {
      enabled: tokenId != null,
      retry: false,
    },
  });

  // ownerOf reverts when token doesn't exist; treat that as "not minted".
  const isMintError = Boolean(error);
  return {
    owner: isMintError ? null : data ?? null,
    isMinted: !isMintError && Boolean(data),
    isLoading,
    refetch,
  };
}

export function usePlotTokenURI(tokenId) {
  const { data, isLoading } = useReadContract({
    abi: PLOT_NFT_ABI,
    address: PLOT_NFT_ADDRESS,
    functionName: "tokenURI",
    args: tokenId != null ? [BigInt(tokenId)] : undefined,
    query: { enabled: tokenId != null, retry: false },
  });
  return { tokenURI: data ?? null, isLoading };
}

export function useTotalSupply() {
  const { data, isLoading, refetch } = useReadContract({
    abi: PLOT_NFT_ABI,
    address: PLOT_NFT_ADDRESS,
    functionName: "totalSupply",
  });
  return {
    totalSupply: data != null ? Number(data) : 0,
    isLoading,
    refetch,
  };
}

// Read ownerOf in parallel for an array of tokenIds. Returns map { [tokenId]: address|null }.
export function usePlotOwners(tokenIds = []) {
  const contracts = tokenIds.map((id) => ({
    abi: PLOT_NFT_ABI,
    address: PLOT_NFT_ADDRESS,
    functionName: "ownerOf",
    args: [BigInt(id)],
  }));
  const { data, isLoading, refetch } = useReadContracts({
    contracts,
    allowFailure: true,
    query: { enabled: tokenIds.length > 0 },
  });
  const owners = {};
  tokenIds.forEach((id, i) => {
    const r = data?.[i];
    owners[id] = r && r.status === "success" ? r.result : null;
  });
  return { owners, isLoading, refetch };
}

export function useMintPlot() {
  const chainId = useChainId();
  const { writeContract, data: hash, isPending, error, reset } =
    useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (receipt.isSuccess && hash) {
      track(PH_EVENTS.PLOT_MINTED, { txHash: hash });
    }
  }, [receipt.isSuccess, hash]);

  const mint = ({ to, tokenURI, plotId }) =>
    writeContract({
      abi: PLOT_NFT_ABI,
      address: PLOT_NFT_ADDRESS,
      functionName: "mint",
      args: [to, tokenURI, plotId],
      chainId,
    });

  return {
    mint,
    hash,
    isPending: isPending || receipt.isLoading,
    isSuccess: receipt.isSuccess,
    isError: Boolean(error) || receipt.isError,
    error: error || receipt.error,
    reset,
  };
}

export function useUpdateTokenURI() {
  const chainId = useChainId();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });
  const run = ({ tokenId, uri }) =>
    writeContract({
      abi: PLOT_NFT_ABI,
      address: PLOT_NFT_ADDRESS,
      functionName: "setTokenURI",
      args: [BigInt(tokenId), uri],
      chainId,
    });
  return {
    run,
    hash,
    isPending: isPending || receipt.isLoading,
    isSuccess: receipt.isSuccess,
    isError: Boolean(error) || receipt.isError,
    error: error || receipt.error,
    reset,
  };
}

export function useIsApprovedForAll(owner, operator) {
  const { data, isLoading, refetch } = useReadContract({
    abi: PLOT_NFT_ABI,
    address: PLOT_NFT_ADDRESS,
    functionName: "isApprovedForAll",
    args: owner && operator ? [owner, operator] : undefined,
    query: { enabled: Boolean(owner) && Boolean(operator) },
  });
  return { isApproved: Boolean(data), isLoading, refetch };
}

export function useSetApprovalForAll() {
  const chainId = useChainId();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });
  const run = ({ operator, approved }) =>
    writeContract({
      abi: PLOT_NFT_ABI,
      address: PLOT_NFT_ADDRESS,
      functionName: "setApprovalForAll",
      args: [operator, approved],
      chainId,
    });
  return {
    run,
    hash,
    isPending: isPending || receipt.isLoading,
    isSuccess: receipt.isSuccess,
    isError: Boolean(error) || receipt.isError,
    error: error || receipt.error,
    reset,
  };
}
