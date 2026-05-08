require("dotenv").config();
const { ethers } = require("ethers");
const solc = require("solc");
const fs = require("fs");
const path = require("path");
const https = require("https");
const querystring = require("querystring");

const ROOT = path.resolve(__dirname, "..");
const CONTRACTS_DIR = path.join(ROOT, "contracts");
const NODE_MODULES = path.join(ROOT, "node_modules");
const FRONTEND_ENV = path.join(ROOT, "frontend", ".env.local");

// Etherscan v2 unified endpoint — pass chainid=11155111 for Sepolia
const ETHERSCAN_API = "https://api.etherscan.io/v2/api";
const CHAIN_ID = "11155111";

// solc version string must match exactly what Etherscan expects.
// solc.version() returns "0.8.35+commit.47b9dedd.Emscripten.clang" but Etherscan
// only accepts "v0.8.35+commit.47b9dedd" (no platform suffix).
const COMPILER_VERSION = `v${solc.version().replace(/\.Emscripten\.clang$/, "")}`;

// --- Helpers ------------------------------------------------------------------

function validate() {
  const missing = ["ETHERSCAN_API_KEY"].filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`Missing env vars: ${missing.join(", ")}`);
    process.exit(1);
  }
  if (!fs.existsSync(FRONTEND_ENV)) {
    console.error(`frontend/.env.local not found. Run deploy.js first.`);
    process.exit(1);
  }
}

function readEnvLocal(key) {
  const content = fs.readFileSync(FRONTEND_ENV, "utf8");
  const match = content.match(new RegExp(`^${key}=(.+)$`, "m"));
  if (!match) throw new Error(`${key} not found in frontend/.env.local`);
  return match[1].trim();
}

// Import resolver — same logic as compile.js; also records every file resolved
// so we can include them all in the verification Standard JSON Input.
function makeImportResolver(resolvedSources) {
  return function findImport(importPath) {
    const candidates = [
      path.join(NODE_MODULES, importPath),
      path.join(CONTRACTS_DIR, importPath),
    ];
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        const content = fs.readFileSync(candidate, "utf8");
        resolvedSources[importPath] = { content }; // standard JSON input uses 'content' (singular)
        return { contents: content };              // callback return uses 'contents' (plural)
      }
    }
    return { error: `File not found: ${importPath}` };
  };
}

// Build full Standard JSON Input including all transitively resolved sources.
// Etherscan needs every file the compiler touched in order to re-compile.
function buildStandardJson(extraSources) {
  // Start with all .sol files in contracts/
  const sources = {};
  for (const file of fs.readdirSync(CONTRACTS_DIR).filter((f) => f.endsWith(".sol"))) {
    sources[file] = { content: fs.readFileSync(path.join(CONTRACTS_DIR, file), "utf8") };
  }
  // Merge in all transitively resolved imports
  Object.assign(sources, extraSources);

  return {
    language: "Solidity",
    sources,
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: { "*": { "*": ["abi", "evm.bytecode"] } },
    },
  };
}

// Run solc once to collect all resolved imports, then return the full Standard
// JSON Input that Etherscan can use to re-verify.
function collectSourcesViaCompilation() {
  const resolvedSources = {};
  const resolver = makeImportResolver(resolvedSources);

  const sources = {};
  for (const file of fs.readdirSync(CONTRACTS_DIR).filter((f) => f.endsWith(".sol"))) {
    sources[file] = { content: fs.readFileSync(path.join(CONTRACTS_DIR, file), "utf8") };
  }

  const input = {
    language: "Solidity",
    sources,
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: { "*": { "*": [] } }, // minimal output — we only need imports resolved
    },
  };

  solc.compile(JSON.stringify(input), { import: resolver });
  return buildStandardJson(resolvedSources);
}

// ABI-encode constructor arguments (strip leading 0x)
function encodeArgs(types, values) {
  return ethers.AbiCoder.defaultAbiCoder().encode(types, values).slice(2);
}

// POST form-encoded data to Etherscan API, return parsed JSON.
// chainid must be a URL query param for v2 — extract it from params and put it in the path.
function etherscanPost(params) {
  return new Promise((resolve, reject) => {
    const { chainid, ...bodyParams } = params;
    const body = querystring.stringify(bodyParams);
    const url = new URL(`${ETHERSCAN_API}?chainid=${chainid}`);
    const options = {
      hostname: url.hostname,
      path: `${url.pathname}${url.search}`,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error(`Non-JSON response: ${data}`));
        }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// GET request to Etherscan API
function etherscanGet(params) {
  return new Promise((resolve, reject) => {
    const qs = querystring.stringify(params);
    const url = new URL(`${ETHERSCAN_API}?${qs}`);
    https.get(url.toString(), (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error(`Non-JSON response: ${data}`));
        }
      });
    }).on("error", reject);
  });
}

// Submit a verification request; returns the GUID Etherscan assigns
async function submitVerification(contractAddress, contractName, standardJson, constructorArgs) {
  const result = await etherscanPost({
    apikey: process.env.ETHERSCAN_API_KEY,
    chainid: CHAIN_ID,
    module: "contract",
    action: "verifysourcecode",
    contractaddress: contractAddress,
    sourceCode: JSON.stringify(standardJson),
    codeformat: "solidity-standard-json-input",
    contractname: `${contractName}.sol:${contractName}`,
    compilerversion: COMPILER_VERSION,
    constructorArguements: constructorArgs, // Etherscan's intentional typo
  });

  if (result.status !== "1") {
    throw new Error(`Submission failed: ${result.result}`);
  }
  return result.result; // GUID
}

// Poll Etherscan until verification completes (pass or fail)
async function pollVerification(guid, label, maxWaitMs = 120_000) {
  const interval = 5_000;
  const start = Date.now();

  while (Date.now() - start < maxWaitMs) {
    await new Promise((r) => setTimeout(r, interval));
    const result = await etherscanGet({
      apikey: process.env.ETHERSCAN_API_KEY,
      chainid: CHAIN_ID,
      module: "contract",
      action: "checkverifystatus",
      guid,
    });

    const status = result.result || "";
    process.stdout.write(`  [${label}] ${status}\n`);

    if (status === "Pass - Verified") return true;
    if (status.startsWith("Fail")) throw new Error(`Verification failed: ${status}`);
    // "Pending" → keep polling
  }

  throw new Error(`Verification timed out after ${maxWaitMs / 1000}s`);
}

// --- Main ---------------------------------------------------------------------

async function main() {
  validate();

  const plotNFTAddress      = readEnvLocal("NEXT_PUBLIC_PLOT_NFT_ADDRESS");
  const marketplaceAddress  = readEnvLocal("NEXT_PUBLIC_MARKETPLACE_ADDRESS");
  const roleManagerAddress  = readEnvLocal("NEXT_PUBLIC_ROLE_MANAGER_ADDRESS");
  const adminAddress        = readEnvLocal("NEXT_PUBLIC_ADMIN_ADDRESS");

  console.log("\nPlotChain — Etherscan verification");
  console.log(`Compiler      : ${COMPILER_VERSION}`);
  console.log(`RoleManager   : ${roleManagerAddress}`);
  console.log(`PlotNFT       : ${plotNFTAddress}`);
  console.log(`Marketplace   : ${marketplaceAddress}\n`);

  console.log("Collecting all source files via compilation...");
  const standardJson = collectSourcesViaCompilation();
  const sourceCount = Object.keys(standardJson.sources).length;
  console.log(`  ${sourceCount} source files collected.\n`);

  const contracts = [
    {
      label: "RoleManager",
      address: roleManagerAddress,
      constructorArgs: encodeArgs(["address"], [adminAddress]),
    },
    {
      label: "PlotNFT",
      address: plotNFTAddress,
      constructorArgs: encodeArgs(["address"], [roleManagerAddress]),
    },
    {
      label: "PlotMarketplace",
      address: marketplaceAddress,
      constructorArgs: encodeArgs(
        ["address", "address", "uint256"],
        [plotNFTAddress, roleManagerAddress, 2n]
      ),
    },
  ];

  for (const { label, address, constructorArgs } of contracts) {
    process.stdout.write(`Submitting ${label} (${address})...`);
    let guid;
    try {
      guid = await submitVerification(address, label, standardJson, constructorArgs);
    } catch (err) {
      // Already verified counts as success
      if (err.message.includes("Already Verified")) {
        console.log(" already verified.");
        continue;
      }
      throw err;
    }
    console.log(` submitted (GUID: ${guid})`);
    console.log(`  Polling for result (up to 2 min)...`);
    await pollVerification(guid, label);
    console.log(`  ${label} ✓ verified\n`);
  }

  console.log("All three contracts verified on Sepolia Etherscan.");
  console.log(`  https://sepolia.etherscan.io/address/${roleManagerAddress}#code`);
  console.log(`  https://sepolia.etherscan.io/address/${plotNFTAddress}#code`);
  console.log(`  https://sepolia.etherscan.io/address/${marketplaceAddress}#code\n`);
}

main().catch((err) => {
  console.error("\nVerification failed:", err.message);
  process.exit(1);
});
