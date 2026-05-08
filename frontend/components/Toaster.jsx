"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

const ToastCtx = createContext({ toast: () => {} });

let counter = 0;

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const dismiss = useCallback((id) => {
    setItems((cur) => cur.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message, opts = {}) => {
      const id = ++counter;
      const variant = opts.variant ?? "info";
      const duration = opts.duration ?? 4000;
      setItems((cur) => [...cur, { id, message, variant }]);
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {items.map((t) => (
          <ToastItem key={t.id} item={t} onClose={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

function ToastItem({ item, onClose }) {
  const colors = {
    success: { bg: "border-success/40", icon: <CheckCircle2 size={18} className="text-success" /> },
    error: { bg: "border-danger/40", icon: <AlertCircle size={18} className="text-danger" /> },
    info: { bg: "border-border", icon: <Info size={18} className="text-amber" /> },
  };
  const c = colors[item.variant] ?? colors.info;
  return (
    <div
      className={`pointer-events-auto card border ${c.bg} px-4 py-3 flex items-start gap-3 shadow-xl slide-in-right`}
    >
      {c.icon}
      <p className="text-sm text-text flex-1 leading-snug break-words">
        {item.message}
      </p>
      <button
        onClick={onClose}
        className="text-muted hover:text-text transition"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function useToast() {
  return useContext(ToastCtx);
}
