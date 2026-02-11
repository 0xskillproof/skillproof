import { defineChain } from "viem";

export const pulsechain = defineChain({
  id: 369,
  name: "PulseChain",
  nativeCurrency: { name: "Pulse", symbol: "PLS", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://pulsechain-rpc.publicnode.com/"] },
  },
  blockExplorers: {
    default: { name: "PulseScan", url: "https://scan.pulsechain.com" },
  },
});

export const pulsechainTestnetV4 = defineChain({
  id: 943,
  name: "PulseChain Testnet v4",
  nativeCurrency: { name: "Test Pulse", symbol: "tPLS", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.v4.testnet.pulsechain.com"] },
  },
  blockExplorers: {
    default: { name: "PulseScan Testnet", url: "https://scan.v4.testnet.pulsechain.com" },
  },
  testnet: true,
});

export interface SkillProofAddresses {
  identityRegistry: `0x${string}`;
  reputationRegistry: `0x${string}`;
  validationRegistry: `0x${string}`;
  groth16Verifier: `0x${string}`;
  zkSkillVerifier: `0x${string}`;
}
