"use client";

import { useEffect, useRef, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import {
  ROLE_MANAGER_ABI,
  ROLE_MANAGER_ADDRESS,
  ADMIN_ADDRESS,
} from "@/constants/contracts";
import { track, PH_EVENTS } from "./usePostHog";

export function useRoles() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { address, isConnected } = useAccount();

  const enabled = Boolean(isConnected && address && ROLE_MANAGER_ADDRESS);

  const { data: isAdminOnChain, isLoading: loadingAdmin } = useReadContract({
    abi: ROLE_MANAGER_ABI,
    address: ROLE_MANAGER_ADDRESS,
    functionName: "isAdmin",
    args: address ? [address] : undefined,
    query: { enabled },
  });

  const { data: isDealerOnChain, isLoading: loadingDealer } = useReadContract({
    abi: ROLE_MANAGER_ABI,
    address: ROLE_MANAGER_ADDRESS,
    functionName: "isDealer",
    args: address ? [address] : undefined,
    query: { enabled },
  });

  // Local fallback: env-configured admin address always counts as admin.
  const envAdminMatch =
    address &&
    ADMIN_ADDRESS &&
    address.toLowerCase() === ADMIN_ADDRESS.toLowerCase();

  const isAdmin = Boolean(isAdminOnChain) || envAdminMatch;
  const isDealer = Boolean(isDealerOnChain);

  const trackedRef = useRef(null);
  useEffect(() => {
    if (isConnected && address && trackedRef.current !== address) {
      trackedRef.current = address;
      track(PH_EVENTS.WALLET_CONNECTED, { address });
    }
  }, [isConnected, address]);

  if (!mounted) {
    return {
      address: undefined,
      isConnected: false,
      isAdmin: false,
      isDealer: false,
      isLoading: true,
    };
  }

  return {
    address,
    isConnected,
    isAdmin,
    isDealer,
    isLoading: enabled && (loadingAdmin || loadingDealer),
  };
}
