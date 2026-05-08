"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useRoles } from "@/hooks/useRoles";
import { useToast } from "./Toaster";
import Skeleton from "./Skeleton";

export default function RoleGuard({ role, children }) {
  const { isAdmin, isDealer, isLoading, isConnected } = useRoles();
  const router = useRouter();
  const { toast } = useToast();
  const redirectedRef = useRef(false);

  const allowed =
    role === "admin" ? isAdmin : role === "dealer" ? isDealer || isAdmin : true;

  useEffect(() => {
    if (isLoading) return;
    if (!isConnected) {
      // Non-connected wallets: don't toast spam — show a prompt below.
      return;
    }
    if (!allowed && !redirectedRef.current) {
      redirectedRef.current = true;
      toast("You do not have access to this page", { variant: "error" });
      router.replace("/");
    }
  }, [isLoading, isConnected, allowed, router, toast]);

  if (isLoading) {
    return (
      <div className="px-6 py-10 max-w-7xl mx-auto space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="card max-w-md w-full p-10 text-center">
          <h2 className="text-2xl font-semibold mb-2">Wallet required</h2>
          <p className="text-muted text-sm mb-6">
            Connect a wallet with the {role} role to view this page.
          </p>
        </div>
      </div>
    );
  }

  if (!allowed) return null;
  return children;
}
