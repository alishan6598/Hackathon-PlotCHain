"use client";

import { memo } from "react";

const STATUS_FILL = {
  Available: "url(#plotGradAvailable)",
  Listed: "url(#plotGradListed)",
  Sold: "url(#plotGradSold)",
  Owned: "url(#plotGradListed)",
  Unminted: "url(#plotGradUnminted)",
};

const STATUS_STROKE = {
  Available: "rgba(120, 200, 255, 0.55)",
  Listed: "rgba(251, 146, 60, 0.95)",
  Sold: "rgba(248, 113, 113, 0.7)",
  Owned: "rgba(251, 146, 60, 0.95)",
  Unminted: "rgba(110, 130, 160, 0.35)",
};

const STATUS_DOT = {
  Available: "#4ade80",
  Listed: "#fb923c",
  Sold: "#f87171",
  Owned: "#fb923c",
  Unminted: "#475569",
};

function PlotShape({ plot, status, onClick, onHover, showLabel = true, simplified = false }) {
  const fill = STATUS_FILL[status] ?? STATUS_FILL.Unminted;
  const stroke = STATUS_STROKE[status] ?? STATUS_STROKE.Unminted;
  const dot = STATUS_DOT[status] ?? STATUS_DOT.Unminted;
  const cx = plot.svgX + plot.svgW / 2;
  const cy = plot.svgY + plot.svgH / 2;
  const isListed = status === "Listed" || status === "Owned";

  // Simplified render — used at low zoom for performance.
  if (simplified) {
    if (plot.type === "odd") {
      return (
        <polygon
          points={plot.points}
          fill={fill}
          stroke={stroke}
          strokeWidth={0.6}
          opacity={0.85}
        />
      );
    }
    return (
      <rect
        x={plot.svgX}
        y={plot.svgY}
        width={plot.svgW}
        height={plot.svgH}
        rx={2}
        fill={fill}
        stroke={stroke}
        strokeWidth={0.6}
        opacity={0.9}
      />
    );
  }

  const handleEnter = (e) => onHover?.(plot, e);
  const handleLeave = () => onHover?.(null, null);

  const ShapeEl = plot.type === "odd" ? (
    <polygon
      points={plot.points}
      fill={fill}
      stroke={stroke}
      strokeWidth={1}
      className={isListed ? "map-listed-stroke" : ""}
    />
  ) : (
    <rect
      x={plot.svgX}
      y={plot.svgY}
      width={plot.svgW}
      height={plot.svgH}
      rx={3}
      fill={fill}
      stroke={stroke}
      strokeWidth={1}
      className={isListed ? "map-listed-stroke" : ""}
    />
  );

  return (
    <g
      onClick={onClick}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{ cursor: "pointer" }}
      className={`map-plot-hover ${isListed ? "map-listed-pulse" : ""}`}
    >
      {ShapeEl}
      {showLabel && (
        <text
          x={cx}
          y={cy + 3}
          textAnchor="middle"
          fontSize={14}
          fontWeight={700}
          fill="#dbeafe"
          fillOpacity={status === "Unminted" ? 0.35 : 0.85}
          style={{ pointerEvents: "none", userSelect: "none", fontFamily: "Metropolis" }}
        >
          {plot.plotNumber}
        </text>
      )}
      {/* Status indicator dot */}
      <circle
        cx={plot.svgX + 8}
        cy={plot.svgY + 8}
        r={3}
        fill={dot}
        className={status !== "Unminted" ? "map-pulse-dot" : ""}
        style={{ pointerEvents: "none" }}
      />
      {plot.isCorner && status !== "Unminted" && (
        <text
          x={plot.svgX + plot.svgW - 5}
          y={plot.svgY + 12}
          textAnchor="end"
          fontSize={10}
          fill="#7dd3fc"
          style={{ pointerEvents: "none" }}
        >
          ★
        </text>
      )}
    </g>
  );
}

export default memo(PlotShape, (a, b) =>
  a.plot.plotNumber === b.plot.plotNumber &&
  a.status === b.status &&
  a.simplified === b.simplified &&
  a.showLabel === b.showLabel
);
