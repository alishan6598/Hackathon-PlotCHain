// Seed all 24 plots in Paradise Valley to PlotNFT.
//
// For each plot: pins a unique metadata JSON to Pinata, then calls batchMint
// with all 24 metadata CIDs in a single transaction.
//
// Required env vars (in .env or frontend/.env.local):
//   PRIVATE_KEY, SEPOLIA_RPC_URL, PINATA_JWT

require("dotenv").config();
// Also load frontend env vars so PINATA_JWT / PINATA_GATEWAY can live in one place.
require("dotenv").config({
  path: require("path").resolve(__dirname, "../frontend/.env.local"),
  override: false,
});

const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const OUTPUT_DIR = path.resolve(__dirname, "../compile/output");
const FRONTEND_ENV = path.resolve(__dirname, "../frontend/.env.local");
const PLOT_DATA_PATH = path.resolve(__dirname, "plotData.json");

// Pre-pinned standard plot image on Pinata IPFS.
const STANDARD_IMAGE_CID =
  "bafybeiangwsqd2eit3mn57zye7e564fs36p2aif22w6q4qncscioxlyp4m";

// --- Helpers ----------------------------------------------------------------

function validate() {
  const missing = ["PRIVATE_KEY", "SEPOLIA_RPC_URL", "PINATA_JWT"].filter(
    (k) => !process.env[k]
  );
  if (missing.length) {
    console.error(`\nMissing env vars: ${missing.join(", ")}`);
    console.error(
      "PINATA_JWT can live in either .env or frontend/.env.local\n"
    );
    process.exit(1);
  }
}

function loadArtifact(name) {
  const file = path.join(OUTPUT_DIR, `${name}.json`);
  if (!fs.existsSync(file)) {
    throw new Error(
      `Artifact not found: ${file}\nRun: node compile/compile.js`
    );
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readEnvLocal(key) {
  if (!fs.existsSync(FRONTEND_ENV)) {
    throw new Error(
      `frontend/.env.local not found. Run deploy.js first.`
    );
  }
  const content = fs.readFileSync(FRONTEND_ENV, "utf8");
  const m = content.match(new RegExp(`^${key}=(.+)$`, "m"));
  if (!m) {
    throw new Error(
      `${key} not found in frontend/.env.local. Run deploy.js first.`
    );
  }
  return m[1].trim();
}

// Pin a unique metadata JSON for one plot to Pinata.
// Returns the IPFS CID (IpfsHash) of the pinned JSON.
async function pinPlotMetadata(plot) {
  const metadata = {
    name: `Plot ${plot.plotId} — Paradise Valley`,
    description: `Paradise Valley. Plot #${plot.plotNumber}, ${plot.size}, facing ${plot.facing}.`,
    plotNumber: plot.plotNumber,
    plotId: plot.plotId,
    street: plot.street,
    type: plot.type,
    size: plot.size,
    facing: plot.facing,
    area: plot.area,
    image: `ipfs://${STANDARD_IMAGE_CID}`,
  };

  const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.PINATA_JWT}`,
    },
    body: JSON.stringify({
      pinataContent: metadata,
      pinataMetadata: { name: `PlotChain-${plot.plotId}` },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pinata upload failed for ${plot.plotId}: ${text}`);
  }

  const json = await res.json();
  return json.IpfsHash;
}

// --- Main -------------------------------------------------------------------

async function main() {
  validate();

  if (!fs.existsSync(PLOT_DATA_PATH)) {
    throw new Error(`plotData.json not found at ${PLOT_DATA_PATH}`);
  }
  const plots = JSON.parse(fs.readFileSync(PLOT_DATA_PATH, "utf8"));

  console.log(`\nPlotChain — seed Paradise Valley (${plots.length} plots)`);
  console.log(`  Image CID : ipfs://${STANDARD_IMAGE_CID}`);
  console.log(`  Pinning unique metadata JSON for each plot...\n`);

  // Pin metadata for every plot and collect tokenURIs.
  const uris = [];
  for (const plot of plots) {
    process.stdout.write(`  ${plot.plotId} `);
    const cid = await pinPlotMetadata(plot);
    uris.push(`ipfs://${cid}`);
    console.log(`→ ${cid}`);
  }

  console.log(`\n  All ${plots.length} metadata JSONs pinned.\n`);

  const plotNFTAddress = readEnvLocal("NEXT_PUBLIC_PLOT_NFT_ADDRESS");
  const artifact = loadArtifact("PlotNFT");

  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const adminAddress = await signer.getAddress();
  const plotNFT = new ethers.Contract(plotNFTAddress, artifact.abi, signer);

  console.log(`  PlotNFT   : ${plotNFTAddress}`);
  console.log(`  Admin     : ${adminAddress}`);

  process.stdout.write(
    `\n  Minting all ${plots.length} plots in a single transaction...`
  );
  const ids = plots.map((p) => p.plotId);
  const tx = await plotNFT.batchMint(adminAddress, plots.length, uris, ids);
  const receipt = await tx.wait();
  console.log(
    ` mined (block ${receipt.blockNumber}, tx ${receipt.hash.slice(0, 10)}...)`
  );

  console.log(
    `\nSeed complete. ${plots.length} plots minted to ${adminAddress}\n`
  );
}

main().catch((err) => {
  console.error("\nSeed failed:", err.message);
  process.exit(1);
});
