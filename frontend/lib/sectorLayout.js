// Paradise Valley — 24-plot layout (2 rows × 12 plots)
// Pure data, no React. Frontend hooks will eventually replace this with
// on-chain reads; preserve the export shape so the swap is trivial.

export const SECTOR_VIEWBOX = "0 0 920 512";

export const ROAD_LABELS = {
  top: "MAIN BOULEVARD",
  bottom: "SOUTH ROAD",
  left: "WEST AVENUE",
  right: "EAST AVENUE",
};

// Amenity / non-tradeable zones — rendered always
export const ZONES = [
  {
    id: "park",
    label: "CENTRAL PARK",
    svgX: 20, svgY: 20, svgW: 140, svgH: 100,
    color: "#DCEFC8",
    strokeColor: "#5C8B36",
    textColor: "#1F3A0E",
    type: "park",
  },
  {
    id: "masjid",
    label: "MASJID",
    svgX: 340, svgY: 20, svgW: 70, svgH: 50,
    color: "#BFE5DC",
    strokeColor: "#1B6F5E",
    textColor: "#0B3027",
    type: "mosque",
  },
  {
    id: "school",
    label: "SCHOOL",
    svgX: 420, svgY: 20, svgW: 70, svgH: 50,
    color: "#FAE6B8",
    strokeColor: "#A8730F",
    textColor: "#3D2906",
    type: "school",
  },
  {
    id: "hospital",
    label: "HOSPITAL",
    svgX: 500, svgY: 20, svgW: 70, svgH: 50,
    color: "#F8C6C5",
    strokeColor: "#8C2B2A",
    textColor: "#3D0E0D",
    type: "hospital",
  },
  {
    id: "markaz",
    label: "MARKAZ",
    svgX: 760, svgY: 20, svgW: 140, svgH: 100,
    color: "#D7D2F2",
    strokeColor: "#534AB7",
    textColor: "#241F5C",
    type: "commercial",
  },
];

// Deterministic PRNG so reloads yield stable mock data.
function rand(seed) {
  let x = seed | 0;
  x = (x ^ 61) ^ (x >>> 16);
  x = x + (x << 3);
  x = x ^ (x >>> 4);
  x = Math.imul(x, 0x27d4eb2d);
  x = x ^ (x >>> 15);
  return ((x >>> 0) % 100000) / 100000;
}

export const STREETS = ["Street A", "Street B"];
export const FACINGS = ["North", "South", "East", "West", "North-East", "North-West", "South-East", "South-West"];

function shortAddr(seed) {
  const hex = "0123456789abcdef";
  let head = "0x", tail = "";
  for (let i = 0; i < 4; i++) head += hex[Math.floor(rand(seed * 31 + i) * 16)];
  for (let i = 0; i < 4; i++) tail += hex[Math.floor(rand(seed * 53 + i + 9) * 16)];
  return `${head}…${tail}`;
}

function txHash(seed) {
  const hex = "0123456789abcdef";
  let head = "0x", tail = "";
  for (let i = 0; i < 4; i++) head += hex[Math.floor(rand(seed * 71 + i) * 16)];
  for (let i = 0; i < 4; i++) tail += hex[Math.floor(rand(seed * 97 + i + 11) * 16)];
  return `${head}…${tail}`;
}

function ipfsCID(seed) {
  const b58 = "abcdefghijklmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ123456789";
  let cid = "Qm";
  for (let i = 0; i < 6; i++) cid += b58[Math.floor(rand(seed * 17 + i) * b58.length)];
  cid += "…";
  for (let i = 0; i < 4; i++) cid += b58[Math.floor(rand(seed * 23 + i + 7) * b58.length)];
  return `ipfs://${cid}`;
}

function fmtDate(daysAgo) {
  const d = new Date(Date.UTC(2026, 4, 8) - daysAgo * 86400000);
  return d.toISOString().slice(0, 10);
}

function buildHistory(tokenId, status, currentOwner, listingPrice) {
  const entries = [];
  // Mint always present
  entries.push({
    from: "0x0000…0000",
    to: "Admin",
    price: null,
    date: fmtDate(120 + Math.floor(rand(tokenId * 2) * 30)),
    txHash: txHash(tokenId * 2 + 1),
    isCurrent: false,
    label: "Mint",
  });

  if (status === "available") {
    entries[entries.length - 1].isCurrent = true;
    return entries;
  }

  // Admin → Dealer
  const dealer = shortAddr(tokenId * 13 + 5);
  entries.push({
    from: "Admin",
    to: dealer,
    price: (1.0 + rand(tokenId * 7) * 0.6).toFixed(2) + " ETH",
    date: fmtDate(60 + Math.floor(rand(tokenId * 3) * 30)),
    txHash: txHash(tokenId * 3 + 1),
    isCurrent: status === "listed",
    label: "Sold",
  });

  if (status === "listed") return entries;

  // Dealer → End user (sold)
  entries.push({
    from: dealer,
    to: currentOwner,
    price: listingPrice ?? (1.5 + rand(tokenId * 11) * 1.5).toFixed(2) + " ETH",
    date: fmtDate(7 + Math.floor(rand(tokenId * 5) * 25)),
    txHash: txHash(tokenId * 5 + 1),
    isCurrent: true,
    label: "Sold",
  });

  return entries;
}

// Build the 24-plot grid: 2 rows × 12 plots per row
function buildPlots() {
  const PLOTS = [];
  const COLS = 12;
  const ROWS = 2;

  // Positioning: plots below amenity zones (which occupy top portion)
  const startX = 20;
  const startY = 150;
  const plotW = 60;
  const plotH = 65;
  const gapX = 5;
  const gapY = 5;

  let tokenId = 1;
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const x = startX + col * (plotW + gapX);
      const y = startY + row * (plotH + gapY);

      const r = rand(tokenId);
      let status;
      if (r < 0.45) status = "available";
      else if (r < 0.70) status = "listed";
      else if (r < 0.98) status = "sold";
      else status = "reserved";

      // All Paradise Valley plots are standard rectangles, no odd shapes
      const isCorner = (col === 0 || col === COLS - 1) && (row === 0 || row === ROWS - 1);
      const type = isCorner ? "Corner" : "Normal";

      const facing = FACINGS[Math.floor(rand(tokenId * 47) * FACINGS.length)];
      const cornerBoost = isCorner ? 0.6 : 0;
      const basePrice = 1.0 + rand(tokenId * 53) * 2.0 + cornerBoost;
      const priceStr = basePrice.toFixed(2) + " ETH";

      const owner =
        status === "available"  ? "Admin"
      : status === "listed"     ? shortAddr(tokenId * 13 + 5)
      : status === "sold"       ? shortAddr(tokenId * 19 + 3)
      : null;

      const price =
        status === "listed" || status === "sold" ? priceStr : null;

      const street = STREETS[row];
      const tokenURI = ipfsCID(tokenId);
      const history = buildHistory(tokenId, status, owner, price);

      // Plot ID format: PV-01 through PV-24
      const plotId = `PV-${String(tokenId).padStart(2, "0")}`;

      PLOTS.push({
        id: plotId,
        tokenId,
        plotNumber: tokenId,
        block: 1,
        svgX: x,
        svgY: y,
        svgW: plotW,
        svgH: plotH,
        status,
        size: "50×90 ft",
        area: "1 Kanal",
        street,
        facing,
        type,
        tradeable: status !== "reserved",
        price,
        owner,
        tokenURI,
        history,
        isCorner,
        isOdd: false,
      });
      tokenId++;
    }
  }
  return PLOTS;
}

export const PLOTS = buildPlots();

export const PLOT_BY_NUMBER = PLOTS.reduce((acc, p) => {
  acc[p.plotNumber] = p;
  return acc;
}, {});
