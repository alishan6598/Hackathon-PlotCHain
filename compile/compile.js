const solc = require("solc");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const CONTRACTS_DIR = path.join(ROOT, "contracts");
const OUTPUT_DIR = path.join(__dirname, "output");
const NODE_MODULES = path.join(ROOT, "node_modules");

// --- Import resolver -----------------------------------------------------------
// solc-js does NOT auto-resolve node_modules. This callback is called for every
// import statement the compiler encounters. We map well-known prefixes to their
// actual paths on disk. Without this, all OZ and ERC-721A imports silently fail
// with "File not found" and the compiler produces no bytecode.
function findImport(importPath) {
  const candidates = [
    // Direct node_modules lookup (covers @openzeppelin/... and erc721a/...)
    path.join(NODE_MODULES, importPath),
    // Relative to contracts/ (shouldn't be needed but safe fallback)
    path.join(CONTRACTS_DIR, importPath),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return { contents: fs.readFileSync(candidate, "utf8") };
    }
  }

  return { error: `File not found: ${importPath}` };
}

// --- Collect contract sources --------------------------------------------------
function buildSources() {
  const sources = {};
  const files = fs.readdirSync(CONTRACTS_DIR).filter((f) => f.endsWith(".sol"));

  if (files.length === 0) {
    throw new Error(`No .sol files found in ${CONTRACTS_DIR}`);
  }

  for (const file of files) {
    const filePath = path.join(CONTRACTS_DIR, file);
    sources[file] = { content: fs.readFileSync(filePath, "utf8") };
    console.log(`  [+] ${file}`);
  }

  return sources;
}

// --- Build solc standard-JSON input -------------------------------------------
function buildInput(sources) {
  return {
    language: "Solidity",
    sources,
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object"],
        },
      },
    },
  };
}

// --- Write one artifact file per contract -------------------------------------
function writeArtifacts(output) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let hasErrors = false;

  if (output.errors && output.errors.length > 0) {
    for (const err of output.errors) {
      if (err.severity === "error") {
        console.error(`  [ERROR] ${err.formattedMessage}`);
        hasErrors = true;
      } else {
        console.warn(`  [WARN]  ${err.formattedMessage}`);
      }
    }
  }

  if (hasErrors) {
    throw new Error("Compilation failed — see errors above.");
  }

  if (!output.contracts) {
    throw new Error("No contracts in compiler output. Check that .sol files are non-empty.");
  }

  let written = 0;
  for (const [sourceFile, contracts] of Object.entries(output.contracts)) {
    for (const [contractName, artifact] of Object.entries(contracts)) {
      const outFile = path.join(OUTPUT_DIR, `${contractName}.json`);
      const data = {
        contractName,
        sourceFile,
        abi: artifact.abi,
        bytecode: "0x" + artifact.evm.bytecode.object,
        deployedBytecode: "0x" + artifact.evm.deployedBytecode.object,
      };
      fs.writeFileSync(outFile, JSON.stringify(data, null, 2));
      console.log(`  [out] compile/output/${contractName}.json  (${artifact.abi.length} ABI entries)`);
      written++;
    }
  }

  return written;
}

// --- Main ---------------------------------------------------------------------
function main() {
  console.log("\nPlotChain — solc compiler\n");
  console.log("Reading sources from contracts/:");
  const sources = buildSources();

  console.log("\nCompiling with solc", solc.version(), "...");
  const input = buildInput(sources);
  const rawOutput = solc.compile(JSON.stringify(input), { import: findImport });
  const output = JSON.parse(rawOutput);

  console.log("\nWriting artifacts to compile/output/:");
  const count = writeArtifacts(output);

  console.log(`\nDone. ${count} artifact(s) written.\n`);
}

main();
