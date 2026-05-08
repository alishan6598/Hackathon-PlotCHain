import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";

// Server-side viem client for API routes.
// Uses SEPOLIA_RPC_URL from .env (not NEXT_PUBLIC_ — this must stay server-only).
export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.SEPOLIA_RPC_URL ?? "https://rpc.sepolia.org"),
});
