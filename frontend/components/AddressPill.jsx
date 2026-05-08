"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";

export function shortAddress(addr) {
  if (!addr) return "—";
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function AddressPill({
  address,
  showEtherscan = true,
  className = "",
  label,
}) {
  const [copied, setCopied] = useState(false);
  if (!address) return <span className="text-outline text-sm">—</span>;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* swallow */
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-xs px-2 py-1.5 rounded bg-surface-container-low border border-outline-variant ${className}`}
    >
      {label && <span className="text-outline not-italic">{label}</span>}
      <span className="text-on-surface">{shortAddress(address)}</span>
      <button
        onClick={handleCopy}
        className="text-outline hover:text-primary transition"
        aria-label="Copy address"
        type="button"
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
      </button>
      {showEtherscan && (
        <a
          href={`https://sepolia.etherscan.io/address/${address}`}
          target="_blank"
          rel="noreferrer"
          className="text-outline hover:text-primary transition"
          aria-label="View on Etherscan"
        >
          <ExternalLink size={12} />
        </a>
      )}
    </span>
  );
}

export function txEtherscan(hash) {
  return `https://sepolia.etherscan.io/tx/${hash}`;
}

export function TxLink({ hash, className = "" }) {
  if (!hash) return null;
  return (
    <a
      href={txEtherscan(hash)}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center gap-1 text-primary hover:underline text-xs ${className}`}
    >
      tx <ExternalLink size={11} />
    </a>
  );
}
