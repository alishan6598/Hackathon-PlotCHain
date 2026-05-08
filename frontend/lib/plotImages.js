// Deterministic fallback images for plot detail panel hero.
// Cycles 8 stock photos by plotNumber so the same plot always renders
// the same image when on-chain metadata isn't available.

const FILES = [
  "photo-1448630360428-65456885c650.avif",
  "photo-1560518883-ce09059eeffa.avif",
  "photo-1565402170291-8491f14678db.avif",
  "photo-1580587771525-78b9dba3b914.avif",
  "photo-1582407947304-fd86f028f716.avif",
  "photo-1605146769289-440113cc3d00.avif",
  "premium_photo-1678903964473-1271ecfb0288.avif",
  "premium_photo-1680281937048-735543c5c0f7.avif",
];

export function fallbackImageFor(plotNumber) {
  const idx = (Number(plotNumber) - 1 + FILES.length) % FILES.length;
  return `/images/plot-fallbacks/${FILES[idx]}`;
}
