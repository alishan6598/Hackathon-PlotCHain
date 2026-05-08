"use client";

export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="border-b border-border flex gap-1 overflow-x-auto">
      {tabs.map((t) => {
        const isActive = t.value === active;
        return (
          <button
            key={t.value}
            onClick={() => onChange(t.value)}
            className={`px-4 py-3 text-sm font-medium relative whitespace-nowrap transition ${
              isActive ? "text-amber" : "text-muted hover:text-text"
            }`}
          >
            {t.label}
            {t.count != null && (
              <span className="ml-2 text-xs bg-surface-container border border-border px-1.5 py-0.5 rounded-full">
                {t.count}
              </span>
            )}
            {isActive && (
              <span className="absolute left-2 right-2 -bottom-px h-0.5 bg-amber rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
