"use client";

import { Plus, Minus, Compass, Crosshair } from "lucide-react";

export default function MapControls({ onZoomIn, onZoomOut, onReset, onFocusBlock1 }) {
  return (
    <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-2 glass rounded-2xl p-2">
      <ControlBtn onClick={onZoomIn} label="Zoom in"><Plus size={18} /></ControlBtn>
      <ControlBtn onClick={onZoomOut} label="Zoom out"><Minus size={18} /></ControlBtn>
      <div className="h-px bg-white/10 my-1" />
      <ControlBtn onClick={onReset} label="Reset view"><Compass size={18} /></ControlBtn>
      <ControlBtn onClick={onFocusBlock1} label="Focus Block 1"><Crosshair size={18} /></ControlBtn>
    </div>
  );
}

function ControlBtn({ children, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="w-10 h-10 rounded-xl flex items-center justify-center text-cyan-100/80 hover:text-white hover:bg-white/10 transition-all"
    >
      {children}
    </button>
  );
}
