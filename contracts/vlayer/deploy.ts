/**
 * deploy.ts — Civis vlayer Prover Deployment
 *
 * Deploys WikipediaProver, RedCrossProver, and MSFProver to Creditcoin Testnet.
 * Creditcoin Testnet is not in viem/chains, so we bypass the vlayer SDK's getConfig()
 * / createContext() and use viem directly.
 *
 * After deploying, updates app/.env.local with the three prover addresses.
 *
 * Usage:
 *   EXAMPLES_TEST_PRIVATE_KEY=0x<key> bun run deploy.ts
 *
 * Or set it in contracts/vlayer/.env:
 *   EXAMPLES_TEST_PRIVATE_KEY=0x<64 hex chars>
 */

import { createWalletClient, createPublicClient, http, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Bun automatically loads .env from the working directory — no dotenv import needed.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Explicit fallback: load .env from the script's directory in case bun is invoked from elsewhere
const envFilePath = path.join(__dirname, ".env");
if (fs.existsSync(envFilePath)) {
  const envLines = fs.readFileSync(envFilePath, "utf-8").split("\n");
  for (const line of envLines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
}

// --- Prover artifacts (compiled by `forge build`) ---
import wikipediaProverSpec from "../out/WikipediaProver.sol/WikipediaProver";
import redCrossProverSpec from "../out/RedCrossProver.sol/RedCrossProver";
import msfProverSpec from "../out/MSFProver.sol/MSFProver";

// --- Creditcoin Testnet chain definition ---
const creditcoinTestnet = defineChain({
  id: 102031,
  name: "Creditcoin Testnet",
  nativeCurrency: { name: "Testnet CTC", symbol: "tCTC", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.cc3-testnet.creditcoin.network"] },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://creditcoin-testnet.blockscout.com",
    },
  },
  testnet: true,
});

// --- Private key validation ---
const rawKey =
  process.env.EXAMPLES_TEST_PRIVATE_KEY ||
  process.env.CTC_DEPLOYER_PRIVATE_KEY;

if (!rawKey) {
  console.error(
    "❌  No private key found.\n" +
    "    Set EXAMPLES_TEST_PRIVATE_KEY in contracts/vlayer/.env\n" +
    "    or pass it as an environment variable.\n" +
    "    Example: EXAMPLES_TEST_PRIVATE_KEY=0x<64 hex chars> bun run deploy.ts"
  );
  process.exit(1);
}
if (!/^0x[0-9a-fA-F]{64}$/.test(rawKey)) {
  console.error("❌  EXAMPLES_TEST_PRIVATE_KEY must be 0x-prefixed and exactly 64 hex chars.");
  process.exit(1);
}

const account = privateKeyToAccount(rawKey as `0x${string}`);
console.log(`🔑  Deployer: ${account.address}`);

// --- Viem clients ---
const publicClient = createPublicClient({
  chain: creditcoinTestnet,
  transport: http("https://rpc.cc3-testnet.creditcoin.network"),
});

const walletClient = createWalletClient({
  chain: creditcoinTestnet,
  transport: http("https://rpc.cc3-testnet.creditcoin.network"),
  account,
});

// --- Check deployer balance ---
const balance = await publicClient.getBalance({ address: account.address });
const balanceEth = Number(balance) / 1e18;
console.log(`💰  Deployer balance: ${balanceEth.toFixed(4)} tCTC`);
if (balanceEth < 0.05) {
  console.warn("⚠️   Balance is low (< 0.05 tCTC). Deployment may fail.");
}

// --- Helper: deploy a single contract and wait for receipt ---
async function deployContract(
  name: string,
  spec: { abi: readonly unknown[]; bytecode: { object: `0x${string}` } }
): Promise<`0x${string}`> {
  console.log(`\n🚀  Deploying ${name}...`);

  const hash = await walletClient.deployContract({
    abi: spec.abi,
    bytecode: spec.bytecode.object,
    args: [],
    chain: creditcoinTestnet,
    account,
  });
  console.log(`    Tx hash: ${hash}`);
  console.log(`    Waiting for confirmation...`);

  const receipt = await publicClient.waitForTransactionReceipt({
    hash,
    confirmations: 2,
    retryCount: 60,
    retryDelay: 3000,
  });

  if (receipt.status !== "success" || !receipt.contractAddress) {
    throw new Error(`${name} deployment failed. Status: ${receipt.status}`);
  }

  console.log(`    ✅  ${name} deployed at: ${receipt.contractAddress}`);
  console.log(
    `    🔍  https://creditcoin-testnet.blockscout.com/address/${receipt.contractAddress}`
  );
  return receipt.contractAddress;
}

// --- Deploy all three provers ---
const wikipediaProver = await deployContract("WikipediaProver", wikipediaProverSpec as any);
const redCrossProver  = await deployContract("RedCrossProver",  redCrossProverSpec  as any);
const msfProver       = await deployContract("MSFProver",       msfProverSpec       as any);

// --- Update app/.env.local ---
const envLocalPath = path.resolve(__dirname, "../../app/.env.local");

if (fs.existsSync(envLocalPath)) {
  let envContent = fs.readFileSync(envLocalPath, "utf-8");

  const replacements: [RegExp, string][] = [
    [/^NEXT_PUBLIC_CIVIS_WIKIPEDIA_PROVER=.*$/m, `NEXT_PUBLIC_CIVIS_WIKIPEDIA_PROVER=${wikipediaProver}`],
    [/^NEXT_PUBLIC_CIVIS_REDCROSS_PROVER=.*$/m,  `NEXT_PUBLIC_CIVIS_REDCROSS_PROVER=${redCrossProver}`],
    [/^NEXT_PUBLIC_CIVIS_MSF_PROVER=.*$/m,        `NEXT_PUBLIC_CIVIS_MSF_PROVER=${msfProver}`],
  ];

  for (const [pattern, replacement] of replacements) {
    if (pattern.test(envContent)) {
      envContent = envContent.replace(pattern, replacement);
    } else {
      // Append if not found
      envContent += `\n${replacement}`;
    }
  }

  fs.writeFileSync(envLocalPath, envContent, "utf-8");
  console.log(`\n📝  Updated app/.env.local with prover addresses.`);
} else {
  console.warn(
    `\n⚠️   app/.env.local not found at ${envLocalPath}.\n` +
    `    Manually set the following:\n` +
    `    NEXT_PUBLIC_CIVIS_WIKIPEDIA_PROVER=${wikipediaProver}\n` +
    `    NEXT_PUBLIC_CIVIS_REDCROSS_PROVER=${redCrossProver}\n` +
    `    NEXT_PUBLIC_CIVIS_MSF_PROVER=${msfProver}`
  );
}

// --- Also write vlayer .env for SDK tooling (merge, preserve existing lines) ---
const vlayerEnvPath = path.join(__dirname, ".env");
let existingEnv = fs.existsSync(vlayerEnvPath) ? fs.readFileSync(vlayerEnvPath, "utf-8") : "";
const vlayerReplacements: [RegExp, string][] = [
  [/^VITE_WIKIPEDIA_PROVER_ADDRESS=.*$/m, `VITE_WIKIPEDIA_PROVER_ADDRESS=${wikipediaProver}`],
  [/^VITE_REDCROSS_PROVER_ADDRESS=.*$/m,  `VITE_REDCROSS_PROVER_ADDRESS=${redCrossProver}`],
  [/^VITE_MSF_PROVER_ADDRESS=.*$/m,       `VITE_MSF_PROVER_ADDRESS=${msfProver}`],
];
for (const [pattern, replacement] of vlayerReplacements) {
  if (pattern.test(existingEnv)) {
    existingEnv = existingEnv.replace(pattern, replacement);
  } else {
    existingEnv += `\n${replacement}`;
  }
}
fs.writeFileSync(vlayerEnvPath, existingEnv, "utf-8");

// --- Summary ---
console.log("\n" + "=".repeat(60));
console.log("🎉  CIVIS PROVER DEPLOYMENT COMPLETE");
console.log("=".repeat(60));
console.log(`WikipediaProver:   ${wikipediaProver}`);
console.log(`RedCrossProver:    ${redCrossProver}`);
console.log(`MSFProver:         ${msfProver}`);
console.log("=".repeat(60));
console.log("\napp/.env.local has been updated. Rebuild the Next.js app to pick up the new addresses.");

