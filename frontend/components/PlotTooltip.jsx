"use client";

const STATUS_COLOR = {
  Available: "#4ade80",
  Listed: "#fb923c",
  Sold: "#f87171",
  Owned: "#fb923c",
  Unminted: "#94a3b8",
};

export default function PlotTooltip({ hover, status }) {
  if (!hover) return null;
  const { plot, x, y } = hover;
  const s = status ?? "Unminted";

  return (
    <div
      className="absolute z-30 pointer-events-none glass-strong rounded-xl px-3.5 py-2.5 min-w-[180px]"
      style={{
        left: Math.min(x + 16, (typeof window !== "undefined" ? window.innerWidth : 0) - 220),
        top: y + 16,
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span
          className="w-2 h-2 rounded-full"
          style={{ background: STATUS_COLOR[s], boxShadow: `0 0 8px ${STATUS_COLOR[s]}` }}
        />
        <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-cyan-100/80">
          {s}
        </span>
      </div>
      <div className="text-base font-bold text-white leading-tight">
        Plot {plot.plotNumber}
      </div>
      <div className="text-[11px] text-white/60 mt-0.5">
        Block {plot.block} · {plot.size}
      </div>
      <div className="text-[10px] text-white/45 mt-1 tracking-wide">
        {plot.street} · {plot.facing}
        {plot.isCorner ? " · Corner" : ""}
        {plot.type === "odd" ? " · Odd shape" : ""}
      </div>
    </div>
  );
}
