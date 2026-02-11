import {
  type PublicClient,
  type WalletClient,
  type Address,
  keccak256,
  toHex,
  encodeFunctionData,
} from "viem";
import { IdentityRegistryABI } from "./abi";

export function computeIdentityHash(agentName: string): `0x${string}` {
  return keccak256(toHex(agentName));
}

export async function registerAgent(
  walletClient: WalletClient,
  registryAddress: Address,
  agentName: string
): Promise<`0x${string}`> {
  const identityHash = computeIdentityHash(agentName);
  const account = walletClient.account;
  if (!account) throw new Error("Wallet client has no account");

  const hash = await walletClient.writeContract({
    address: registryAddress,
    abi: IdentityRegistryABI,
    functionName: "registerIdentity",
    args: [identityHash],
    account,
    chain: walletClient.chain,
  });

  return hash;
}

export async function isAgentRegistered(
  publicClient: PublicClient,
  registryAddress: Address,
  agentAddress: Address
): Promise<boolean> {
  return publicClient.readContract({
    address: registryAddress,
    abi: IdentityRegistryABI,
    functionName: "isRegistered",
    args: [agentAddress],
  }) as Promise<boolean>;
}

export async function getAgentIdentity(
  publicClient: PublicClient,
  registryAddress: Address,
  agentAddress: Address
) {
  return publicClient.readContract({
    address: registryAddress,
    abi: IdentityRegistryABI,
    functionName: "getIdentity",
    args: [agentAddress],
  });
}
