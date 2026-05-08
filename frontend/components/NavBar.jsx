"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function NavBar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 h-16 bg-surface-container-lowest border-b border-outline-variant flex items-center px-6 justify-between">
      {/* Branding */}
      <Link href="/" className="flex items-center gap-3 group shrink-0">
        <span className="w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center">
          <span className="w-3 h-3 rounded-sm bg-primary inline-block" />
        </span>
        <div className="leading-tight">
          <p className="text-base font-bold text-on-surface">
            Paradise Valley
          </p>
          <p className="text-[10px] font-semibold tracking-widest uppercase text-outline opacity-70">
            On-chain Plot Registry
          </p>
        </div>
      </Link>

      {/* Wallet */}
      <ConnectButton accountStatus="address" chainStatus="icon" showBalance={false} />
    </header>
  );
}
