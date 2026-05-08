"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Layers } from "lucide-react";

const ZONE_ROWS = [
  { color: "linear-gradient(135deg,#1e88e5,#0d47a1)", label: "Markaz" },
  { color: "linear-gradient(135deg,#43a047,#1b5e20)", label: "Park" },
  { color: "linear-gradient(135deg,#fbc02d,#7b6010)", label: "Apartments" },
  { color: "linear-gradient(135deg,#ef4444,#7f1d1d)", label: "Commercial" },
  { color: "linear-gradient(135deg,#94a3b8,#3a4458)", label: "Schools / Public" },
  { color: "linear-gradient(135deg,#a89880,#3a2f22)", label: "Masjid" },
];

const STATUS_ROWS = [
  { color: "#4ade80", label: "Available" },
  { color: "#fb923c", label: "Listed" },
  { color: "#f87171", label: "Sold" },
  { color: "#475569", label: "Unminted" },
];

export default function ZoningLegend() {
  const [open, setOpen] = useState(true);

  return (
    <div className="absolute bottom-6 left-6 z-20 glass rounded-2xl p-3.5 w-[260px]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between mb-2"
      >
        <span className="flex items-center gap-2 text-cyan-100/90">
          <Layers size={14} />
          <span className="text-[11px] font-bold tracking-[0.18em] uppercase">
            Zoning · Status
          </span>
        </span>
        {open ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>

      {open && (
        <>
          <div className="grid grid-cols-2 gap-y-2 gap-x-3 mt-1">
            {ZONE_ROWS.map((row) => (
              <div key={row.label} className="flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded-[3px] border border-white/10 shrink-0"
                  style={{ backgroundImage: row.color }}
                />
                <span className="text-[10px] font-semibold tracking-wide text-white/80">
                  {row.label}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-y-2 gap-x-3">
            {STATUS_ROWS.map((row) => (
              <div key={row.label} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{
                    background: row.color,
                    boxShadow: `0 0 8px ${row.color}80`,
                  }}
                />
                <span className="text-[10px] font-semibold tracking-wide text-white/70">
                  {row.label}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
