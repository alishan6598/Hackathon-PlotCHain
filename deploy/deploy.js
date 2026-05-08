require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const OUTPUT_DIR = path.resolve(__dirname, "../compile/output");
const FRONTEND_ENV = path.resolve(__dirname, "../frontend/.env.local");

// --- Helpers ------------------------------------------------------------------

function loadArtifact(name) {
  const file = path.join(OUTPUT_DIR, `${name}.json`);
  if (!fs.existsSync(file)) {
    throw new Error(`Artifact not found: ${file}\nRun: node compile/compile.js`);
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function validate() {
  const missing = ["PRIVATE_KEY", "SEPOLIA_RPC_URL"].filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`Missing env vars: ${missing.join(", ")}`);
    console.error("Copy .env.example to .env and fill in the values.");
    process.exit(1);
  }
}

// Merge new key=value pairs into frontend/.env.local without clobbering
// existing lines (preserves PINATA_JWT, PINATA_GATEWAY if already set).
function writeEnvLocal(updates) {
  let existing = "";
  if (fs.existsSync(FRONTEND_ENV)) {
    existing = fs.readFileSync(FRONTEND_ENV, "utf8");
  }

  const lines = existing.split("\n");
  const result = [];
  const written = new Set();

  for (const line of lines) {
    const match = line.match(/^([A-Z0-9_]+)=/);
    if (match && updates[match[1]] !== undefined) {
      result.push(`${match[1]}=${updates[match[1]]}`);
      written.add(match[1]);
    } else {
      result.push(line);
    }
  }

  // Append any keys not already present in the file
  for (const [key, value] of Object.entries(updates)) {
    if (!written.has(key)) {
      result.push(`${key}=${value}`);
    }
  }

  // Trim trailing blank lines then add a single newline at end
  const content = result.join("\n").replace(/\n+$/, "") + "\n";
  fs.mkdirSync(path.dirname(FRONTEND_ENV), { recursive: true });
  fs.writeFileSync(FRONTEND_ENV, content);
}

// --- Deploy -------------------------------------------------------------------

async function deploy(factory, label, ...args) {
  process.stdout.write(`Deploying ${label}...`);
  const contract = await factory.deploy(...args);
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log(` ${address}`);
  return { contract, address };
}

async function main() {
  validate();

  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const adminAddress = await signer.getAddress();

  console.log("\nPlotChain — deploy to Sepolia");
  console.log(`Admin wallet : ${adminAddress}`);
  console.log(`Network      : ${(await provider.getNetwork()).name}\n`);

  // Load artifacts
  const roleManagerArtifact = loadArtifact("RoleManager");
  const plotNFTArtifact = loadArtifact("PlotNFT");
  const marketplaceArtifact = loadArtifact("PlotMarketplace");

  // 1. RoleManager — no dependencies
  const roleManagerFactory = new ethers.ContractFactory(
    roleManagerArtifact.abi,
    roleManagerArtifact.bytecode,
    signer
  );
  const { address: roleManagerAddress } = await deploy(
    roleManagerFactory,
    "RoleManager",
    adminAddress
  );

  // 2. PlotNFT — depends on RoleManager
  const plotNFTFactory = new ethers.ContractFactory(
    plotNFTArtifact.abi,
    plotNFTArtifact.bytecode,
    signer
  );
  const { address: plotNFTAddress } = await deploy(
    plotNFTFactory,
    "PlotNFT    ",
    roleManagerAddress
  );

  // 3. PlotMarketplace — depends on PlotNFT + RoleManager; commission = 2%
  const marketplaceFactory = new ethers.ContractFactory(
    marketplaceArtifact.abi,
    marketplaceArtifact.bytecode,
    signer
  );
  const { contract: marketplace, address: marketplaceAddress } = await deploy(
    marketplaceFactory,
    "PlotMarketplace",
    plotNFTAddress,
    roleManagerAddress,
    2
  );

  // Get the block the marketplace was deployed at (used as getLogs fromBlock)
  const deployReceipt = await marketplace.deploymentTransaction().wait();
  const deploymentBlock = deployReceipt.blockNumber;

  // Write all NEXT_PUBLIC_ vars to frontend/.env.local
  writeEnvLocal({
    NEXT_PUBLIC_PLOT_NFT_ADDRESS: plotNFTAddress,
    NEXT_PUBLIC_MARKETPLACE_ADDRESS: marketplaceAddress,
    NEXT_PUBLIC_ROLE_MANAGER_ADDRESS: roleManagerAddress,
    NEXT_PUBLIC_ADMIN_ADDRESS: adminAddress,
    NEXT_PUBLIC_DEPLOYMENT_BLOCK: String(deploymentBlock),
  });

  console.log("\n--- Deployment complete ---");
  console.log(`RoleManager     : ${roleManagerAddress}`);
  console.log(`PlotNFT         : ${plotNFTAddress}`);
  console.log(`PlotMarketplace : ${marketplaceAddress}`);
  console.log(`Admin           : ${adminAddress}`);
  console.log(`Deploy block    : ${deploymentBlock}`);
  console.log(`\nAddresses written to frontend/.env.local\n`);
}

main().catch((err) => {
  console.error("\nDeploy failed:", err.message);
  process.exit(1);
});
