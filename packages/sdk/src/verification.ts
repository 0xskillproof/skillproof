import {
  type PublicClient,
  type WalletClient,
  type Address,
} from "viem";
import { ZKSkillVerifierABI, ValidationRegistryABI } from "./abi";
import type { SkillAuditProof } from "./proof";

export async function submitProofOnchain(
  walletClient: WalletClient,
  zkSkillVerifierAddress: Address,
  proof: SkillAuditProof,
  identityHash: `0x${string}`
): Promise<`0x${string}`> {
  const account = walletClient.account;
  if (!account) throw new Error("Wallet client has no account");

  const hash = await walletClient.writeContract({
    address: zkSkillVerifierAddress,
    abi: ZKSkillVerifierABI,
    functionName: "submitProof",
    args: [
      proof.pA as any,
      proof.pB as any,
      proof.pC as any,
      proof.publicSignals as any,
      identityHash,
    ],
    account,
    chain: walletClient.chain,
  });

  return hash;
}

export async function hasValidProof(
  publicClient: PublicClient,
  zkSkillVerifierAddress: Address,
  agentIdHash: `0x${string}`,
  skillHash: `0x${string}`
): Promise<boolean> {
  return publicClient.readContract({
    address: zkSkillVerifierAddress,
    abi: ZKSkillVerifierABI,
    functionName: "hasValidProof",
    args: [agentIdHash, skillHash],
  }) as Promise<boolean>;
}

export async function getProofRecord(
  publicClient: PublicClient,
  zkSkillVerifierAddress: Address,
  agentIdHash: `0x${string}`,
  skillHash: `0x${string}`
) {
  return publicClient.readContract({
    address: zkSkillVerifierAddress,
    abi: ZKSkillVerifierABI,
    functionName: "getProofRecord",
    args: [agentIdHash, skillHash],
  });
}

export async function hasValidation(
  publicClient: PublicClient,
  validationRegistryAddress: Address,
  identityHash: `0x${string}`,
  skillHash: `0x${string}`
): Promise<boolean> {
  return publicClient.readContract({
    address: validationRegistryAddress,
    abi: ValidationRegistryABI,
    functionName: "hasValidation",
    args: [identityHash, skillHash],
  }) as Promise<boolean>;
}
