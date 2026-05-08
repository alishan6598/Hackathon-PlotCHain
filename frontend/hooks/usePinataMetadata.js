"use client";

import { useQuery } from "@tanstack/react-query";

export function cidFromTokenURI(tokenURI) {
  if (!tokenURI) return null;
  if (tokenURI.startsWith("ipfs://")) return tokenURI.slice("ipfs://".length);
  // Already a CID-only string
  return tokenURI;
}

export function ipfsHttpUrl(uri) {
  if (!uri) return null;
  const cid = cidFromTokenURI(uri);
  return `/api/pinata/metadata?cid=${encodeURIComponent(cid)}&raw=1`;
}

async function fetchMetadata(tokenURI) {
  const cid = cidFromTokenURI(tokenURI);
  if (!cid) return null;
  const res = await fetch(`/api/pinata/metadata?cid=${encodeURIComponent(cid)}`);
  if (!res.ok) throw new Error(`Failed to fetch metadata for ${cid}`);
  return res.json();
}

export function usePinataMetadata(tokenURI) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["pinata-metadata", tokenURI ?? null],
    queryFn: () => fetchMetadata(tokenURI),
    enabled: Boolean(tokenURI),
    staleTime: 5 * 60 * 1000, // 5 min — allows image CID updates to propagate
  });

  // Normalize image URL — accept `image`, `imageUrl`, or `imageCID`.
  let imageUrl = null;
  if (data) {
    const raw = data.imageUrl ?? data.image ?? data.imageCID ?? null;
    if (raw) {
      if (raw.startsWith("ipfs://")) imageUrl = ipfsHttpUrl(raw);
      else if (raw.startsWith("http")) imageUrl = raw;
      else imageUrl = ipfsHttpUrl(raw);
    }
  }

  return {
    metadata: data
      ? {
          plotNumber: data.plotNumber ?? data.plot_number ?? null,
          block: data.block ?? null,
          street: data.street ?? null,
          size: data.size ?? null,
          facing: data.facing ?? null,
          area: data.area ?? null,
          name: data.name ?? null,
          description: data.description ?? null,
          imageUrl,
          raw: data,
        }
      : null,
    isLoading,
    error,
  };
}
