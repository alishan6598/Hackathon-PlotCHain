"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Wallet } from "lucide-react";

export default function ConnectPrompt({
  title = "Connect your wallet",
  message = "Connect a wallet to view this section.",
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="card max-w-md w-full p-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber/10 text-amber flex items-center justify-center mx-auto mb-4">
          <Wallet size={26} />
        </div>
        <h2 className="text-2xl font-semibold mb-2">{title}</h2>
        <p className="text-muted text-sm mb-6">{message}</p>
        <div className="flex justify-center">
          <ConnectButton />
        </div>
      </div>
    </div>
  );
}
