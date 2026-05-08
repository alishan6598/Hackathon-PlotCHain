"use client";

import Link from "next/link";
import { ImageOff } from "lucide-react";
import { usePlotTokenURI } from "@/hooks/usePlotNFT";
import { usePinataMetadata } from "@/hooks/usePinataMetadata";
import StatusBadge from "./StatusBadge";
import Skeleton from "./Skeleton";

export default function PlotCard({
  plot,
  status,
  priceLabel,
  href,
  children,
}) {
  const { tokenURI } = usePlotTokenURI(plot.plotNumber);
  const { metadata, isLoading } = usePinataMetadata(tokenURI);

  const Inner = (
    <>
      <div className="aspect-video rounded-lg overflow-hidden bg-surface-container mb-3 border border-outline-variant">
        {isLoading && !metadata ? (
          <Skeleton className="w-full h-full" />
        ) : metadata?.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={metadata.imageUrl}
            alt={`Plot ${plot.plotNumber}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <EmptyImage />
        )}
      </div>
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="label-technical text-outline">Plot</p>
          <p className="headline-md text-on-surface">#{plot.plotNumber}</p>
        </div>
        {status && <StatusBadge status={status} />}
      </div>
      <div className="text-xs text-on-surface-variant space-y-0.5 mb-3">
        <p>
          {plot.size} · {plot.facing}
        </p>
        <p>
          Block {plot.block} · {plot.street}
        </p>
      </div>
      {priceLabel && (
        <p className="text-primary font-bold text-sm mb-3">{priceLabel}</p>
      )}
      {children}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="card p-4 block hover:border-primary transition"
      >
        {Inner}
      </Link>
    );
  }
  return <div className="card p-4">{Inner}</div>;
}

function EmptyImage() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-slate-50 text-slate-400">
      <ImageOff size={20} />
      <span className="text-[10px] font-medium uppercase tracking-wide">
        No image on-chain
      </span>
    </div>
  );
}

// Reusable thumbnail for table rows + small lists.
// Renders the Pinata image if present, otherwise an empty-state — never a stock photo.
export function PlotThumb({ tokenId, size = 48, rounded = "rounded-md" }) {
  const { tokenURI } = usePlotTokenURI(tokenId);
  const { metadata, isLoading } = usePinataMetadata(tokenURI);

  const dim = { width: size, height: size };

  if (isLoading && !metadata) {
    return (
      <div
        className={`${rounded} overflow-hidden border border-outline-variant bg-surface-container`}
        style={dim}
      >
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  if (!metadata?.imageUrl) {
    return (
      <div
        className={`${rounded} overflow-hidden border border-outline-variant bg-slate-50 flex items-center justify-center text-slate-400`}
        style={dim}
        title="No image on-chain"
      >
        <ImageOff size={Math.max(12, Math.floor(size / 3))} />
      </div>
    );
  }

  return (
    <div
      className={`${rounded} overflow-hidden border border-outline-variant`}
      style={dim}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={metadata.imageUrl}
        alt={`Plot ${tokenId}`}
        className="w-full h-full object-cover"
      />
    </div>
  );
}
