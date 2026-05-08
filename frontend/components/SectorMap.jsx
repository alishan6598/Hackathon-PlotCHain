"use client";

import {
  memo,
  useCallback,
  useMemo,
  useState,
  useRef,
  useEffect,
} from "react";
import {
  Search,
  X,
  ExternalLink,
  Download,
  Heart,
  ZoomIn,
  ZoomOut,
  Maximize2,
  MapPin,
  Tag,
  Wallet,
  Sparkles,
} from "lucide-react";
import { formatEther } from "viem";

import { PLOTS, ROAD_LABELS } from "../lib/sectorLayout";
import { usePlotOwners } from "@/hooks/usePlotNFT";
import { useListings } from "@/hooks/useMarketplace";

// ---------------------------------------------------------------------------
// Fresh coordinate system — bigger plots, better spacing
// ---------------------------------------------------------------------------

const VB_W = 1200;
const VB_H = 660;
const ROAD_T = 22;

// Amenity zones — re-coordinated for the new viewBox
const ZONE_DEFS = [
  { id: "park",     label: "CENTRAL PARK", x: 32,   y: 38,  w: 220, h: 140, fill: "#DCEFC8", stroke: "#5C8B36", text: "#1F3A0E", type: "park" },
  { id: "masjid",   label: "MASJID",       x: 430,  y: 50,  w: 120, h: 110, fill: "#BFE5DC", stroke: "#1B6F5E", text: "#0B3027", type: "mosque" },
  { id: "school",   label: "SCHOOL",       x: 560,  y: 50,  w: 120, h: 110, fill: "#FAE6B8", stroke: "#A8730F", text: "#3D2906", type: "school" },
  { id: "hospital", label: "HOSPITAL",     x: 690,  y: 50,  w: 120, h: 110, fill: "#F8C6C5", stroke: "#8C2B2A", text: "#3D0E0D", type: "hospital" },
  { id: "markaz",   label: "MARKAZ",       x: 950,  y: 38,  w: 220, h: 140, fill: "#D7D2F2", stroke: "#534AB7", text: "#241F5C", type: "commercial" },
];

// Build plot coordinates — 2 rows × 12 columns, sized big
const PLOT_W   = 86;
const PLOT_H   = 132;
const GAP_X    = 8;
const GAP_Y    = 14;
const GRID_W   = 12 * (PLOT_W + GAP_X) - GAP_X; // 1120
const GRID_X0  = (VB_W - GRID_W) / 2;           // 40
const GRID_Y0  = 220;

const PLOT_LAYOUT = PLOTS.map((p, i) => {
  const col = i % 12;
  const row = Math.floor(i / 12);
  return {
    ...p,
    svgX: GRID_X0 + col * (PLOT_W + GAP_X),
    svgY: GRID_Y0 + row * (PLOT_H + GAP_Y),
    svgW: PLOT_W,
    svgH: PLOT_H,
  };
});

// ---------------------------------------------------------------------------
// Status palette
// ---------------------------------------------------------------------------

const STATUS = {
  available: { fill: "#97C459", stroke: "#3B6D11", label: "#173404", chip: "Available" },
  listed:    { fill: "#EF9F27", stroke: "#854F0B", label: "#412402", chip: "For sale"  },
  sold:      { fill: "#E24B4A", stroke: "#791F1F", label: "#501313", chip: "Sold"      },
  unminted:  { fill: "#E5E7EB", stroke: "#9CA3AF", label: "#374151", chip: "Not minted" },
};

const FILTERS = [
  { key: "all",       label: "All",        dot: "#1a1c1c" },
  { key: "available", label: "Available",  dot: STATUS.available.fill },
  { key: "listed",    label: "For sale",   dot: STATUS.listed.fill },
  { key: "sold",      label: "Sold",       dot: STATUS.sold.fill },
  { key: "unminted",  label: "Not minted", dot: STATUS.unminted.fill },
];

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

export default function SectorMap() {
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [filter, setFilter]             = useState("all");
  const [search, setSearch]             = useState("");
  const [hoveredPlot, setHoveredPlot]   = useState(null);
  const [tooltipPos, setTooltipPos]     = useState({ x: 0, y: 0 });

  // ---- Live on-chain data --------------------------------------------------
  const tokenIds = useMemo(() => PLOT_LAYOUT.map(p => p.tokenId), []);
  const adminAddress = (process.env.NEXT_PUBLIC_ADMIN_ADDRESS || "").toLowerCase();
  const { owners }   = usePlotOwners(tokenIds);
  const { listings } = useListings(tokenIds);

  const livePlots = useMemo(() => {
    return PLOT_LAYOUT.map((p) => {
      const owner   = owners[p.tokenId];
      const ownerLc = owner?.toLowerCase();
      const listing = listings[p.tokenId];

      let status, ownerLabel = null, price = null;
      if (!owner) {
        status = "unminted";
      } else if (listing?.isActive) {
        status = "listed";
        ownerLabel = listing.seller;
        try { price = `${Number(formatEther(listing.price)).toFixed(3)} ETH`; } catch {}
      } else if (ownerLc === adminAddress) {
        status = "available";
        ownerLabel = owner;
      } else {
        status = "sold";
        ownerLabel = owner;
      }
      return { ...p, status, ownerLabel, price };
    });
  }, [owners, listings, adminAddress]);

  // Keep selected plot in sync with live data
  const selectedLive = selectedPlot
    ? livePlots.find(p => p.tokenId === selectedPlot.tokenId) || selectedPlot
    : null;

  const matches = useCallback((p) => {
    if (filter !== "all" && p.status !== filter) return false;
    const q = search.trim().toLowerCase();
    if (q && !p.id.toLowerCase().includes(q) && !String(p.tokenId).includes(q)) return false;
    return true;
  }, [filter, search]);

  const stats = useMemo(() => {
    let total = 0, available = 0, listed = 0, sold = 0, unminted = 0;
    for (const p of livePlots) {
      if (!matches(p)) continue;
      total++;
      if (p.status === "available") available++;
      else if (p.status === "listed") listed++;
      else if (p.status === "sold") sold++;
      else unminted++;
    }
    return { total, available, listed, sold, unminted };
  }, [livePlots, matches]);

  // ---- Zoom / pan ----------------------------------------------------------
  const [zoom, setZoom] = useState(1);
  const [pan, setPan]   = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef(null);
  const containerRef = useRef(null);

  const clampZoom = (z) => Math.min(4, Math.max(0.6, z));

  // Ensure at least `margin` SVG units of content remain inside the viewBox on every edge.
  const clampPan = useCallback((p, z) => {
    const margin = 120; // SVG units
    return {
      x: Math.min(VB_W - margin, Math.max(margin - z * VB_W, p.x)),
      y: Math.min(VB_H - margin, Math.max(margin - z * VB_H, p.y)),
    };
  }, []);

  const zoomTo = useCallback((delta, cx = 0, cy = 0) => {
    setZoom((prev) => {
      const next = clampZoom(prev + delta);
      const scale = next / prev;
      setPan((p) => clampPan({ x: cx - scale * (cx - p.x), y: cy - scale * (cy - p.y) }, next));
      return next;
    });
  }, [clampPan]);
  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    zoomTo(e.deltaY < 0 ? 0.18 : -0.18, e.clientX - rect.left, e.clientY - rect.top);
  }, [zoomTo]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const onMouseDown = (e) => {
    if (e.target.closest(".plot-rect")) return;
    setIsPanning(true);
    panStart.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y };
  };
  const onMouseMove = (e) => {
    if (!isPanning || !panStart.current) return;
    const raw = {
      x: panStart.current.px + (e.clientX - panStart.current.mx),
      y: panStart.current.py + (e.clientY - panStart.current.my),
    };
    setPan(clampPan(raw, zoom));
  };
  const onMouseUp = () => { setIsPanning(false); panStart.current = null; };

  const detailOpen = !!selectedLive;

  return (
    <div className="w-full flex flex-col gap-4">
      <Toolbar
        search={search} onSearchChange={setSearch}
        filter={filter} onFilterChange={setFilter}
        stats={stats}
      />

      {/* Side-by-side map + detail */}
      <div className="flex gap-4 items-stretch">
        {/* Map area */}
        <div
          ref={containerRef}
          className="relative flex-1 overflow-hidden rounded-2xl border border-slate-200 shadow-xl bg-gradient-to-br from-slate-50 via-white to-slate-50"
          style={{ height: 640, cursor: isPanning ? "grabbing" : "grab" }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            width="100%" height="100%"
            style={{ display: "block", userSelect: "none" }}
          >
            <Defs />

            <g
              transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}
              style={{ transformOrigin: "0 0", transition: isPanning ? "none" : "transform 0.15s ease" }}
            >
              {/* Roads / perimeter */}
              <rect x="0" y="0" width={VB_W} height={ROAD_T} fill="url(#roadGrad)" />
              <rect x="0" y={VB_H - ROAD_T} width={VB_W} height={ROAD_T} fill="url(#roadGrad)" />
              <rect x="0" y="0" width={ROAD_T} height={VB_H} fill="url(#roadGrad)" />
              <rect x={VB_W - ROAD_T} y="0" width={ROAD_T} height={VB_H} fill="url(#roadGrad)" />
              <rect x={ROAD_T} y={ROAD_T + 174} width={VB_W - 2 * ROAD_T} height="2" fill="url(#roadLine)" opacity="0.6" />

              <text x={VB_W / 2} y="15" textAnchor="middle" fontSize="11" fontWeight="700" fill="#FAFAF7" letterSpacing="4">
                {ROAD_LABELS.top}
              </text>
              <text x={VB_W / 2} y={VB_H - 7} textAnchor="middle" fontSize="11" fontWeight="700" fill="#FAFAF7" letterSpacing="4">
                {ROAD_LABELS.bottom}
              </text>
              <text x="11" y={VB_H / 2} textAnchor="middle" fontSize="10" fontWeight="700" fill="#FAFAF7" letterSpacing="3"
                    transform={`rotate(-90 11 ${VB_H / 2})`}>
                {ROAD_LABELS.left}
              </text>
              <text x={VB_W - 11} y={VB_H / 2} textAnchor="middle" fontSize="10" fontWeight="700" fill="#FAFAF7" letterSpacing="3"
                    transform={`rotate(90 ${VB_W - 11} ${VB_H / 2})`}>
                {ROAD_LABELS.right}
              </text>

              <AmenityZones />

              <PlotLayer
                plots={livePlots}
                matches={matches}
                selectedId={selectedLive?.tokenId}
                onSelect={setSelectedPlot}
                onHover={(p, e) => { setHoveredPlot(p); if (e) setTooltipPos({ x: e.clientX, y: e.clientY }); }}
                onMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
                onLeave={() => setHoveredPlot(null)}
              />
            </g>
          </svg>

          <Legend />

          {/* Zoom controls */}
          <div className="absolute right-4 bottom-4 flex flex-col gap-1.5">
            <ControlBtn onClick={() => zoomTo(0.25)} title="Zoom in"><ZoomIn size={15} /></ControlBtn>
            <ControlBtn onClick={() => zoomTo(-0.25)} title="Zoom out"><ZoomOut size={15} /></ControlBtn>
            <ControlBtn onClick={resetView} title="Reset view"><Maximize2 size={14} /></ControlBtn>
          </div>
          <div className="absolute right-16 bottom-4 rounded-lg border border-slate-200 bg-white/90 px-2.5 py-1.5 text-[11px] font-mono text-slate-600 shadow">
            {Math.round(zoom * 100)}%
          </div>
        </div>

        {/* Right-side detail panel — slides in/out */}
        <div
          className="overflow-hidden transition-all duration-300 ease-out"
          style={{ width: detailOpen ? 420 : 0, opacity: detailOpen ? 1 : 0 }}
        >
          {selectedLive && (
            <DetailPanel plot={selectedLive} onClose={() => setSelectedPlot(null)} />
          )}
        </div>
      </div>

      <PlotTooltip plot={hoveredPlot} pos={tooltipPos} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Defs (gradients / filters)
// ---------------------------------------------------------------------------

function Defs() {
  return (
    <defs>
      <linearGradient id="roadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2D3139" />
        <stop offset="100%" stopColor="#1F2227" />
      </linearGradient>
      <linearGradient id="roadLine" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#F5F3EE" stopOpacity="0.5" />
        <stop offset="50%" stopColor="#E8E4D8" stopOpacity="1" />
        <stop offset="100%" stopColor="#F5F3EE" stopOpacity="0.5" />
      </linearGradient>
      {Object.entries(STATUS).map(([key, c]) => (
        <linearGradient key={key} id={`pg-${key}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c.fill} stopOpacity="1" />
          <stop offset="100%" stopColor={c.stroke} stopOpacity="0.85" />
        </linearGradient>
      ))}
      <filter id="pshadow">
        <feDropShadow dx="0" dy="1.5" stdDeviation="1.8" floodOpacity="0.22" />
      </filter>
      <filter id="hglow">
        <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#3B82F6" floodOpacity="0.55" />
      </filter>
      <filter id="sglow">
        <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#2563EB" floodOpacity="0.65" />
      </filter>
    </defs>
  );
}

// ---------------------------------------------------------------------------
// Toolbar
// ---------------------------------------------------------------------------

function Toolbar({ search, onSearchChange, filter, onFilterChange, stats }) {
  return (
    <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3">
      <label className="relative flex h-10 w-full sm:w-72 items-center">
        <Search size={16} className="absolute left-3 text-slate-400" />
        <input
          type="text" value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search plot (PV-17, PV-05…)"
          className="h-full w-full rounded-lg border border-slate-300 bg-white pl-9 pr-9 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
        />
        {search && (
          <button onClick={() => onSearchChange("")} className="absolute right-3 text-slate-400 hover:text-slate-700">
            <X size={14} />
          </button>
        )}
      </label>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button key={f.key} onClick={() => onFilterChange(f.key)}
              className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition ${
                active
                  ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}>
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: f.dot }} />
              {f.label}
            </button>
          );
        })}
      </div>

      <div className="ml-auto rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 shadow-sm">
        <span className="font-bold text-slate-900">{stats.total}</span>
        <span className="mx-2 text-slate-300">|</span>
        <span className="font-semibold text-emerald-700">{stats.available}</span>
        <span className="mx-1">avail</span>
        <span className="mx-2 text-slate-300">|</span>
        <span className="font-semibold text-amber-700">{stats.listed}</span>
        <span className="mx-1">listed</span>
        <span className="mx-2 text-slate-300">|</span>
        <span className="font-semibold text-rose-700">{stats.sold}</span>
        <span className="mx-1">sold</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Amenity zones
// ---------------------------------------------------------------------------

function AmenityZones() {
  return (
    <g>
      {ZONE_DEFS.map((z) => {
        const isLarge = z.w >= 180;
        const fontSize = isLarge ? 13 : 10;
        const labelY = z.y + fontSize + 6;
        const ornCx = z.x + z.w / 2;
        const ornCy = z.y + z.h * 0.62;
        return (
          <g key={z.id}>
            <rect x={z.x} y={z.y} width={z.w} height={z.h}
                  fill={z.fill} stroke={z.stroke} strokeWidth="2" rx={8} opacity="0.95" />
            <text x={z.x + z.w / 2} y={labelY} textAnchor="middle"
                  fontSize={fontSize} fontWeight="800" fill={z.text} letterSpacing="2">
              {z.label}
            </text>
            {z.type === "park"       && <ParkOrnaments    cx={ornCx} cy={ornCy} />}
            {z.type === "mosque"     && <MosqueOrnament   cx={ornCx} cy={ornCy} />}
            {z.type === "school"     && <SchoolOrnament   cx={ornCx} cy={ornCy} />}
            {z.type === "hospital"   && <HospitalOrnament cx={ornCx} cy={ornCy} />}
            {z.type === "commercial" && <MarkazOrnament   z={z} />}
          </g>
        );
      })}
    </g>
  );
}

function ParkOrnaments({ cx, cy }) {
  const trees = [[-50, -10], [-22, 10], [10, -8], [38, 6], [-30, 28], [22, 26]];
  return (
    <g>
      {trees.map(([dx, dy], i) => (
        <g key={i}>
          <circle cx={cx + dx} cy={cy + dy} r="9" fill="#7AB349" />
          <circle cx={cx + dx + 3} cy={cy + dy + 2} r="6" fill="#5C8B36" />
        </g>
      ))}
    </g>
  );
}

function MosqueOrnament({ cx, cy }) {
  return (
    <g>
      <rect x={cx - 18} y={cy - 8} width="36" height="18" fill="#5FAE99" stroke="#1B6F5E" strokeWidth="1.2" />
      <path d={`M ${cx - 14} ${cy - 8} a 14 14 0 0 1 28 0`} fill="#3F8B7B" stroke="#1B6F5E" strokeWidth="1.2" />
      <rect x={cx + 14} y={cy - 22} width="3" height="20" fill="#3F8B7B" />
      <circle cx={cx + 15.5} cy={cy - 24} r="2" fill="#3F8B7B" />
    </g>
  );
}

function SchoolOrnament({ cx, cy }) {
  const x = cx - 22, y = cy - 12;
  return (
    <g>
      <rect x={x} y={y} width="44" height="28" fill="#E0AD4F" stroke="#7A4F08" strokeWidth="1.2" />
      <polygon points={`${x},${y} ${x + 22},${y - 12} ${x + 44},${y}`} fill="#A86F12" stroke="#7A4F08" strokeWidth="1.2" />
      <rect x={x + 18} y={y + 12} width="8" height="16" fill="#7A4F08" />
    </g>
  );
}

function HospitalOrnament({ cx, cy }) {
  const x = cx - 24, y = cy - 14;
  return (
    <g>
      <rect x={x} y={y} width="48" height="32" fill="#E37875" stroke="#791F1F" strokeWidth="1.2" />
      <rect x={x + 19} y={y + 6} width="10" height="20" fill="#FFF" />
      <rect x={x + 14} y={y + 11} width="20" height="10" fill="#FFF" />
    </g>
  );
}

function MarkazOrnament({ z }) {
  const baseY = z.y + z.h - 12;
  const heights = [22, 32, 18, 38, 24, 30, 18, 28, 20, 26];
  const totalW = heights.length * 14 - 4;
  const startX = z.x + (z.w - totalW) / 2;
  return (
    <g>
      {heights.map((h, i) => (
        <rect key={i} x={startX + i * 14} y={baseY - h} width="10" height={h}
              fill="#8C82D6" stroke="#534AB7" strokeWidth="0.6" />
      ))}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Plot layer
// ---------------------------------------------------------------------------

function PlotLayer({ plots, matches, selectedId, onSelect, onHover, onLeave, onMove }) {
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <g>
      {plots.map((p) => {
        const ok      = matches(p);
        const colors  = STATUS[p.status];
        const isHov   = hoveredId === p.tokenId;
        const isSel   = selectedId === p.tokenId;
        const cx = p.svgX + p.svgW / 2;
        const cy = p.svgY + p.svgH / 2;

        let filterId = "url(#pshadow)";
        if (isSel) filterId = "url(#sglow)";
        else if (isHov) filterId = "url(#hglow)";

        let strokeColor = colors.stroke;
        let strokeW = 1;
        if (isSel)      { strokeColor = "#2563EB"; strokeW = 2.5; }
        else if (isHov) { strokeColor = "#3B82F6"; strokeW = 2; }

        return (
          <g
            key={p.tokenId}
            opacity={ok ? 1 : 0.16}
            style={{ transition: "opacity 0.2s" }}
            transform={isHov && ok ? `translate(${cx},${cy}) scale(1.05) translate(${-cx},${-cy})` : ""}
          >
            <rect x={p.svgX + 1.5} y={p.svgY + 1.5} width={p.svgW} height={p.svgH}
                  fill={colors.stroke} rx={6} opacity="0.18" pointerEvents="none" />
            <rect
              className="plot-rect"
              x={p.svgX} y={p.svgY} width={p.svgW} height={p.svgH}
              fill={`url(#pg-${p.status})`}
              stroke={strokeColor} strokeWidth={strokeW}
              rx={6}
              filter={filterId}
              style={{ cursor: ok ? "pointer" : "not-allowed", transition: "stroke 0.12s, stroke-width 0.12s" }}
              onClick={() => ok && onSelect(p)}
              onMouseEnter={(e) => { if (!ok) return; setHoveredId(p.tokenId); onHover(p, e); }}
              onMouseMove={(e) => { if (ok && hoveredId === p.tokenId) onMove?.(e); }}
              onMouseLeave={() => { setHoveredId(null); onLeave(); }}
            />

            {/* Plot ID */}
            <text x={cx} y={cy - 18} textAnchor="middle"
                  fontSize="14" fontWeight="800" fill={colors.label} pointerEvents="none">
              {p.id}
            </text>
            {/* Status chip text */}
            <text x={cx} y={cy} textAnchor="middle"
                  fontSize="9" fontWeight="700" fill={colors.label} opacity="0.85"
                  pointerEvents="none" letterSpacing="0.5">
              {colors.chip.toUpperCase()}
            </text>
            {/* Price or token id */}
            <text x={cx} y={cy + 18} textAnchor="middle"
                  fontSize="9" fontWeight="600" fill={colors.label} opacity="0.7" pointerEvents="none">
              {p.price ?? `#${p.tokenId}`}
            </text>

            {/* Corner star */}
            {p.isCorner && (
              <g pointerEvents="none">
                <circle cx={p.svgX + p.svgW - 9} cy={p.svgY + 9} r="7" fill={colors.stroke} opacity="0.92" />
                <text x={p.svgX + p.svgW - 9} y={p.svgY + 12} textAnchor="middle"
                      fontSize="9" fill="white" fontWeight="900">★</text>
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Legend, controls, tooltip
// ---------------------------------------------------------------------------

function Legend() {
  return (
    <div className="absolute bottom-4 left-4 rounded-xl border border-slate-200 bg-white/95 px-3 py-2.5 text-xs shadow-lg backdrop-blur-sm pointer-events-none">
      <p className="font-bold text-slate-700 mb-2 uppercase tracking-wide text-[9px]">Plot Status</p>
      <div className="space-y-1.5">
        {Object.entries(STATUS).map(([key, c]) => (
          <div key={key} className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-sm shadow-sm"
                  style={{ background: c.fill, border: `1.5px solid ${c.stroke}` }} />
            <span className="text-slate-700 font-medium">{c.chip}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[9px] text-slate-400">Scroll to zoom · Drag to pan</p>
    </div>
  );
}

function ControlBtn({ onClick, title, children }) {
  return (
    <button onClick={onClick} title={title}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white/95 shadow hover:bg-slate-50 transition text-slate-700">
      {children}
    </button>
  );
}

function PlotTooltip({ plot, pos }) {
  if (!plot) return null;
  const c = STATUS[plot.status];
  return (
    <div
      className="pointer-events-none fixed z-50 rounded-xl border border-slate-200 bg-white shadow-2xl px-4 py-3 text-xs"
      style={{ left: pos.x + 16, top: pos.y + 16, minWidth: 200 }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="font-bold text-slate-900 text-sm">{plot.id}</span>
        <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{ background: c.fill, color: c.label, border: `1px solid ${c.stroke}` }}>
          {c.chip}
        </span>
      </div>
      <div className="space-y-1 text-slate-600">
        <Row k="Token ID" v={`#${plot.tokenId}`} />
        <Row k="Size"     v={plot.size} />
        <Row k="Facing"   v={plot.facing} />
        <Row k="Type"     v={plot.type} />
        {plot.price && <Row k="Price" v={plot.price} bold />}
      </div>
      <p className="mt-2 text-[10px] text-blue-600 font-medium">Click to view details →</p>
    </div>
  );
}

function Row({ k, v, bold }) {
  return (
    <div className="flex justify-between gap-4">
      <span>{k}</span>
      <span className={`text-slate-900 ${bold ? "font-bold" : "font-semibold"}`}>{v}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail panel — slides in from the right
// ---------------------------------------------------------------------------

const DetailPanel = memo(function DetailPanel({ plot, onClose }) {
  const c = STATUS[plot.status];
  return (
    <div className="h-full w-[420px] rounded-2xl border border-slate-200 bg-white shadow-xl overflow-y-auto" style={{ maxHeight: 640 }}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100 p-5 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
            {plot.street} · {plot.facing}-facing · {plot.type}
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <h3 className="text-2xl font-bold text-slate-900">{plot.id}</h3>
            <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                  style={{ background: c.fill, border: `1.5px solid ${c.stroke}`, color: c.label }}>
              {c.chip}
            </span>
          </div>
        </div>
        <button onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 transition text-slate-500 shrink-0">
          <X size={18} />
        </button>
      </div>

      <div className="p-5 space-y-5">
        {/* Big price card if listed */}
        {plot.status === "listed" && plot.price && (
          <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4">
            <p className="text-[10px] uppercase tracking-widest text-amber-700 font-bold flex items-center gap-1">
              <Tag size={11} /> Listed at
            </p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{plot.price}</p>
            <button className="mt-3 w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition">
              Buy now
            </button>
          </div>
        )}

        {plot.status === "unminted" && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-start gap-3">
            <Sparkles size={16} className="text-slate-500 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Not minted yet</p>
              <p className="text-xs text-slate-600 mt-0.5">This plot has not been registered on-chain. Admin can mint from the Admin Panel.</p>
            </div>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <Stat icon={<MapPin size={12} />} label="Size"     value={plot.size} />
          <Stat icon={<MapPin size={12} />} label="Area"     value={plot.area} />
          <Stat icon={<Sparkles size={12} />} label="Type"   value={plot.type} />
          <Stat icon={<Tag size={12} />}    label="Token ID" value={`#${plot.tokenId}`} />
        </div>

        {/* Owner */}
        {plot.ownerLabel && (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1.5 flex items-center gap-1">
              <Wallet size={11} /> Current owner
            </p>
            <div className="font-mono text-xs text-slate-800 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg break-all">
              {plot.ownerLabel}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-1">
          <a
            href={`https://sepolia.etherscan.io/token/?a=${plot.tokenId}`}
            target="_blank" rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            <ExternalLink size={14} /> View on Etherscan
          </a>
          <div className="grid grid-cols-2 gap-2">
            <button className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
              <Heart size={14} /> Watch
            </button>
            <button className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
              <Download size={14} /> Cert
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

function Stat({ icon, label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2.5">
      <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold flex items-center gap-1">
        {icon} {label}
      </p>
      <p className="mt-0.5 text-sm font-bold text-slate-900 truncate">{value}</p>
    </div>
  );
}
