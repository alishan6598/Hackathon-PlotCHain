"use client";

import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { parseAbiItem } from "viem";
import {
  PLOT_NFT_ADDRESS,
  MARKETPLACE_ADDRESS,
  DEPLOYMENT_BLOCK,
} from "@/constants/contracts";

const TRANSFER_EVENT = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
);
const PLOT_SOLD_EVENT = parseAbiItem(
  "event PlotSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price, uint256 commission)"
);
const PLOT_LISTED_EVENT = parseAbiItem(
  "event PlotListed(uint256 indexed tokenId, address indexed seller, uint256 price)"
);
const PLOT_DELISTED_EVENT = parseAbiItem(
  "event PlotDelisted(uint256 indexed tokenId, address indexed seller)"
);

async function fetchHistory(client, tokenId) {
  if (!client || tokenId == null) return [];
  const tokenIdBig = BigInt(tokenId);
  const fromBlock = DEPLOYMENT_BLOCK;

  const [transfers, sales, listings, delistings] = await Promise.all([
    client.getLogs({
      address: PLOT_NFT_ADDRESS,
      event: TRANSFER_EVENT,
      args: { tokenId: tokenIdBig },
      fromBlock,
      toBlock: "latest",
    }),
    client.getLogs({
      address: MARKETPLACE_ADDRESS,
      event: PLOT_SOLD_EVENT,
      args: { tokenId: tokenIdBig },
      fromBlock,
      toBlock: "latest",
    }),
    client.getLogs({
      address: MARKETPLACE_ADDRESS,
      event: PLOT_LISTED_EVENT,
      args: { tokenId: tokenIdBig },
      fromBlock,
      toBlock: "latest",
    }),
    client.getLogs({
      address: MARKETPLACE_ADDRESS,
      event: PLOT_DELISTED_EVENT,
      args: { tokenId: tokenIdBig },
      fromBlock,
      toBlock: "latest",
    }),
  ]);

  const blockSet = new Set();
  [...transfers, ...sales, ...listings, ...delistings].forEach((log) =>
    blockSet.add(log.blockNumber)
  );

  const blockTimes = {};
  await Promise.all(
    [...blockSet].map(async (bn) => {
      try {
        const b = await client.getBlock({ blockNumber: bn });
        blockTimes[bn.toString()] = Number(b.timestamp);
      } catch {
        blockTimes[bn.toString()] = null;
      }
    })
  );

  const events = [];
  for (const log of transfers) {
    const isMint =
      log.args.from === "0x0000000000000000000000000000000000000000";
    events.push({
      type: isMint ? "Mint" : "Transfer",
      from: log.args.from,
      to: log.args.to,
      price: null,
      txHash: log.transactionHash,
      blockNumber: log.blockNumber,
      logIndex: log.logIndex,
      timestamp: blockTimes[log.blockNumber.toString()],
    });
  }
  for (const log of sales) {
    events.push({
      type: "Sold",
      from: log.args.seller,
      to: log.args.buyer,
      price: log.args.price,
      commission: log.args.commission,
      txHash: log.transactionHash,
      blockNumber: log.blockNumber,
      logIndex: log.logIndex,
      timestamp: blockTimes[log.blockNumber.toString()],
    });
  }
  for (const log of listings) {
    events.push({
      type: "Listed",
      from: log.args.seller,
      to: null,
      price: log.args.price,
      txHash: log.transactionHash,
      blockNumber: log.blockNumber,
      logIndex: log.logIndex,
      timestamp: blockTimes[log.blockNumber.toString()],
    });
  }
  for (const log of delistings) {
    events.push({
      type: "Delisted",
      from: log.args.seller,
      to: null,
      price: null,
      txHash: log.transactionHash,
      blockNumber: log.blockNumber,
      logIndex: log.logIndex,
      timestamp: blockTimes[log.blockNumber.toString()],
    });
  }

  events.sort((a, b) => {
    if (a.blockNumber === b.blockNumber) return Number(b.logIndex - a.logIndex);
    return Number(b.blockNumber - a.blockNumber);
  });
  return events;
}

export function usePlotHistory(tokenId) {
  const client = usePublicClient();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["plot-history", String(tokenId)],
    queryFn: () => fetchHistory(client, tokenId),
    enabled: Boolean(client) && tokenId != null,
    staleTime: 60_000,
  });
  return { events: data ?? [], isLoading, error, refetch };
}

// Hook for global event feed (used by Admin tx log + dashboards).
async function fetchGlobal(client) {
  if (!client) return { sold: [], listed: [], delisted: [] };
  const fromBlock = DEPLOYMENT_BLOCK;
  const [sold, listed, delisted] = await Promise.all([
    client.getLogs({
      address: MARKETPLACE_ADDRESS,
      event: PLOT_SOLD_EVENT,
      fromBlock,
      toBlock: "latest",
    }),
    client.getLogs({
      address: MARKETPLACE_ADDRESS,
      event: PLOT_LISTED_EVENT,
      fromBlock,
      toBlock: "latest",
    }),
    client.getLogs({
      address: MARKETPLACE_ADDRESS,
      event: PLOT_DELISTED_EVENT,
      fromBlock,
      toBlock: "latest",
    }),
  ]);
  const blockSet = new Set();
  [...sold, ...listed, ...delisted].forEach((l) => blockSet.add(l.blockNumber));
  const blockTimes = {};
  await Promise.all(
    [...blockSet].map(async (bn) => {
      try {
        const b = await client.getBlock({ blockNumber: bn });
        blockTimes[bn.toString()] = Number(b.timestamp);
      } catch {
        blockTimes[bn.toString()] = null;
      }
    })
  );
  const tag = (logs, type) =>
    logs.map((log) => ({
      type,
      tokenId: log.args.tokenId,
      seller: log.args.seller,
      buyer: log.args.buyer,
      price: log.args.price,
      commission: log.args.commission,
      txHash: log.transactionHash,
      blockNumber: log.blockNumber,
      logIndex: log.logIndex,
      timestamp: blockTimes[log.blockNumber.toString()],
    }));
  return {
    sold: tag(sold, "Sold"),
    listed: tag(listed, "Listed"),
    delisted: tag(delisted, "Delisted"),
  };
}

export function useGlobalEvents() {
  const client = usePublicClient();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["plot-global-events"],
    queryFn: () => fetchGlobal(client),
    enabled: Boolean(client),
    staleTime: 30_000,
  });
  return {
    sold: data?.sold ?? [],
    listed: data?.listed ?? [],
    delisted: data?.delisted ?? [],
    isLoading,
    refetch,
  };
}
