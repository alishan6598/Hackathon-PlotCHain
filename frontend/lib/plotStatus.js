// Derives a plot's display status from ownership + listing.
//   not minted                                 → "Unminted"
//   owned by admin (treasury)                  → "Available"  (ready to list / be claimed)
//   listed (any owner)                         → "Listed"
//   owned by non-admin & not listed            → "Sold"

const ADMIN_ADDRESS = (
  process.env.NEXT_PUBLIC_ADMIN_ADDRESS || ""
).toLowerCase();

export function deriveStatus({ owner, listing }) {
  if (!owner) return "Unminted";
  if (listing && listing.isActive) return "Listed";
  if (ADMIN_ADDRESS && owner.toLowerCase() === ADMIN_ADDRESS) return "Available";
  return "Sold";
}
