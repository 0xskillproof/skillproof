import {
  createPublicClient,
  createWalletClient,
  http,
  type PublicClient,
  type WalletClient,
  type Address,
  type Chain,
  type Transport,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { pulsechain, type SkillProofAddresses } from "./chain";
import { computeIdentityHash, registerAgent, isAgentRegistered, getAgentIdentity } from "./identity";
import { generateProof, verifyProofOffchain, type SkillAuditInput, type SkillAuditProof } from "./proof";
import { submitProofOnchain, hasValidProof, getProofRecord, hasValidation } from "./verification";

export interface SkillProofClientConfig {
  addresses: SkillProofAddresses;
  privateKey?: `0x${string}`;
  rpcUrl?: string;
  chain?: Chain;
  circuitsBuildDir?: string;
}

export class SkillProofClient {
  public readonly publicClient: PublicClient;
  public readonly walletClient: WalletClient | null;
  public readonly addresses: SkillProofAddresses;
  private readonly circuitsBuildDir?: string;

  constructor(config: SkillProofClientConfig) {
    const chain = config.chain ?? pulsechain;
    const transport = http(config.rpcUrl ?? chain.rpcUrls.default.http[0]);

    this.publicClient = createPublicClient({ chain, transport });
    this.addresses = config.addresses;
    this.circuitsBuildDir = config.circuitsBuildDir;

    if (config.privateKey) {
      const account = privateKeyToAccount(config.privateKey);
      this.walletClient = createWalletClient({ account, chain, transport });
    } else {
      this.walletClient = null;
    }
  }

  // Identity
  async registerAgent(agentName: string): Promise<`0x${string}`> {
    if (!this.walletClient) throw new Error("No wallet configured");
    return registerAgent(this.walletClient, this.addresses.identityRegistry, agentName);
  }

  async isRegistered(address: Address): Promise<boolean> {
    return isAgentRegistered(this.publicClient, this.addresses.identityRegistry, address);
  }

  async getIdentity(address: Address) {
    return getAgentIdentity(this.publicClient, this.addresses.identityRegistry, address);
  }

  computeIdentityHash(agentName: string): `0x${string}` {
    return computeIdentityHash(agentName);
  }

  // Proof generation
  async generateProof(input: SkillAuditInput): Promise<SkillAuditProof> {
    return generateProof(input, this.circuitsBuildDir);
  }

  async verifyProofOffchain(proof: SkillAuditProof): Promise<boolean> {
    return verifyProofOffchain(proof, this.circuitsBuildDir);
  }

  // On-chain verification
  async submitProof(proof: SkillAuditProof, identityHash: `0x${string}`): Promise<`0x${string}`> {
    if (!this.walletClient) throw new Error("No wallet configured");
    return submitProofOnchain(this.walletClient, this.addresses.zkSkillVerifier, proof, identityHash);
  }

  async hasValidProof(agentIdHash: `0x${string}`, skillHash: `0x${string}`): Promise<boolean> {
    return hasValidProof(this.publicClient, this.addresses.zkSkillVerifier, agentIdHash, skillHash);
  }

  async getProofRecord(agentIdHash: `0x${string}`, skillHash: `0x${string}`) {
    return getProofRecord(this.publicClient, this.addresses.zkSkillVerifier, agentIdHash, skillHash);
  }

  async hasValidation(identityHash: `0x${string}`, skillHash: `0x${string}`): Promise<boolean> {
    return hasValidation(this.publicClient, this.addresses.validationRegistry, identityHash, skillHash);
  }
}
