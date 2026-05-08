// Decorative image strip + stats bar shown above the sector map on the home page.
// Images are the 8 stock photos from /images/ copied to public/images/plot-fallbacks/.

const PHOTOS = [
  "/images/plot-fallbacks/photo-1580587771525-78b9dba3b914.avif",
  "/images/plot-fallbacks/premium_photo-1678903964473-1271ecfb0288.avif",
  "/images/plot-fallbacks/photo-1560518883-ce09059eeffa.avif",
  "/images/plot-fallbacks/photo-1605146769289-440113cc3d00.avif",
  "/images/plot-fallbacks/premium_photo-1680281937048-735543c5c0f7.avif",
];

const STATS = [
  { label: "Total Plots", value: "24" },
  { label: "Live On-Chain", value: "24" },
  { label: "Network", value: "Sepolia" },
  { label: "Commission", value: "2%" },
];

export default function HomeHero() {
  return (
    <div className="border-b border-outline-variant bg-surface-container-lowest">
      {/* Image strip */}
      <div className="flex gap-2 px-4 pt-4 overflow-x-auto no-scrollbar">
        {PHOTOS.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={src}
            alt={`Property ${i + 1}`}
            className="h-28 w-48 object-cover rounded-lg border border-outline-variant shrink-0 hover:scale-[1.02] transition-transform cursor-pointer"
          />
        ))}
        {/* Coming soon tile */}
        <div className="h-28 w-48 shrink-0 rounded-lg border-2 border-dashed border-outline-variant flex flex-col items-center justify-center gap-1 text-outline hover:border-primary hover:text-primary transition-colors cursor-pointer">
          <span className="text-2xl font-bold">v1.1</span>
          <span className="text-[10px] font-bold uppercase tracking-widest">
            Coming Soon
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 divide-x divide-outline-variant border-t border-outline-variant mt-4">
        {STATS.map((s) => (
          <div key={s.label} className="px-4 py-3 text-center">
            <p className="text-xl font-bold text-on-surface">{s.value}</p>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-outline mt-0.5">
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
