"use client";

import { formatEther } from "viem";
import { ExternalLink } from "lucide-react";
import { shortAddress, txEtherscan } from "./AddressPill";

const TYPE_STYLE = {
  Mint: { bg: "#dbeafe", fg: "#1d4ed8" },
  Transfer: { bg: "#e3e2e2", fg: "#404752" },
  Listed: { bg: "#ffedd5", fg: "#c2410c" },
  Delisted: { bg: "#e3e2e2", fg: "#404752" },
  Sold: { bg: "#dcfce7", fg: "#15803d" },
};

function fmtDate(ts) {
  if (!ts) return "—";
  const d = new Date(ts * 1000);
  return d.toLocaleString();
}

export default function HistoryTimeline({ events, isLoading }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-14 w-full" />
        ))}
      </div>
    );
  }
  if (!events || events.length === 0) {
    return (
      <p className="text-sm text-outline text-center py-6">
        No on-chain activity yet.
      </p>
    );
  }
  return (
    <ol className="relative pl-5">
      <span className="absolute left-1.5 top-2 bottom-2 w-px bg-outline-variant" />
      {events.map((e, i) => {
        const style = TYPE_STYLE[e.type] ?? TYPE_STYLE.Transfer;
        return (
          <li key={`${e.txHash}-${e.logIndex ?? i}`} className="relative pb-4">
            <span className="absolute -left-[6px] top-1.5 w-3 h-3 rounded-full bg-primary border-2 border-surface-container-lowest" />
            <div className="flex flex-wrap items-center gap-2 text-xs mb-1">
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
                style={{ background: style.bg, color: style.fg }}
              >
                {e.type}
              </span>
              <span className="text-outline">{fmtDate(e.timestamp)}</span>
              <a
                href={txEtherscan(e.txHash)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                tx <ExternalLink size={11} />
              </a>
            </div>
            <p className="text-sm text-on-surface">
              {e.from && (
                <>
                  <span className="text-outline">from </span>
                  <span className="font-mono">{shortAddress(e.from)}</span>
                </>
              )}
              {e.to && (
                <>
                  <span className="text-outline"> → </span>
                  <span className="font-mono">{shortAddress(e.to)}</span>
                </>
              )}
              {e.price != null && e.price !== 0n && (
                <>
                  <span className="text-outline"> · </span>
                  <span className="text-primary font-semibold">
                    {formatEther(e.price)} ETH
                  </span>
                </>
              )}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
