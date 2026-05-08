/**
 * Grants the Marketplace contract approval to transfer all NFTs owned by admin.
 * Run this once after deploy if buyPlot reverts with "gas limit too high".
 *
 *   node deploy/approve-marketplace.js
 */

require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const OUTPUT_DIR = path.resolve(__dirname, "../compile/output");
const FRONTEND_ENV = path.resolve(__dirname, "../frontend/.env.local");

function readEnvLocal(key) {
  const content = fs.readFileSync(FRONTEND_ENV, "utf8");
  const match = content.match(new RegExp(`^${key}=(.+)$`, "m"));
  if (!match) throw new Error(`${key} not found in frontend/.env.local`);
  return match[1].trim();
}

async function main() {
  const { PRIVATE_KEY, SEPOLIA_RPC_URL } = process.env;
  if (!PRIVATE_KEY || !SEPOLIA_RPC_URL) {
    console.error("Missing PRIVATE_KEY or SEPOLIA_RPC_URL in .env");
    process.exit(1);
  }

  const nftAddress = readEnvLocal("NEXT_PUBLIC_PLOT_NFT_ADDRESS");
  const marketAddress = readEnvLocal("NEXT_PUBLIC_MARKETPLACE_ADDRESS");

  const { abi: nftAbi } = JSON.parse(
    fs.readFileSync(path.join(OUTPUT_DIR, "PlotNFT.json"), "utf8")
  );

  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log(`Admin wallet : ${wallet.address}`);
  console.log(`NFT contract : ${nftAddress}`);
  console.log(`Marketplace  : ${marketAddress}`);

  const nft = new ethers.Contract(nftAddress, nftAbi, wallet);

  // Check current approval status
  const already = await nft.isApprovedForAll(wallet.address, marketAddress);
  if (already) {
    console.log("\n✅ Marketplace is already approved. Nothing to do.");
    return;
  }

  console.log("\nSending setApprovalForAll(marketplace, true)…");
  const tx = await nft.setApprovalForAll(marketAddress, true);
  console.log(`Tx hash: ${tx.hash}`);
  const receipt = await tx.wait();
  console.log(`✅ Confirmed in block ${receipt.blockNumber}`);
  console.log("\nBuyPlot should now work. Buyers can purchase listed plots.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
