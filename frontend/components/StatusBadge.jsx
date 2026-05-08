const VARIANTS = {
  Available: { bg: "#dcfce7", fg: "#15803d", dot: "#4ade80" },
  Listed: { bg: "#ffedd5", fg: "#c2410c", dot: "#fb923c" },
  Sold: { bg: "#fee2e2", fg: "#b91c1c", dot: "#f87171" },
  Owned: { bg: "#dbeafe", fg: "#1d4ed8", dot: "#3b82f6" },
  Unminted: { bg: "#e3e2e2", fg: "#404752", dot: "#9e9e9e" },
};

export default function StatusBadge({ status, className = "" }) {
  const v = VARIANTS[status] ?? VARIANTS.Unminted;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${className}`}
      style={{ background: v.bg, color: v.fg }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: v.dot }}
      />
      {status}
    </span>
  );
}
