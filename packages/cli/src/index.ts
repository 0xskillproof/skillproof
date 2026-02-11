#!/usr/bin/env node

import { Command } from "commander";
import {
  SkillProofClient,
  type SkillProofAddresses,
  type SkillAuditInput,
  computeIdentityHash,
} from "@skillproof/sdk";

const program = new Command();

function getClient(): SkillProofClient {
  const addresses: SkillProofAddresses = {
    identityRegistry: (process.env.IDENTITY_REGISTRY || "0x0") as `0x${string}`,
    reputationRegistry: (process.env.REPUTATION_REGISTRY || "0x0") as `0x${string}`,
    validationRegistry: (process.env.VALIDATION_REGISTRY || "0x0") as `0x${string}`,
    groth16Verifier: (process.env.GROTH16_VERIFIER || "0x0") as `0x${string}`,
    zkSkillVerifier: (process.env.ZK_SKILL_VERIFIER || "0x0") as `0x${string}`,
  };

  return new SkillProofClient({
    addresses,
    privateKey: process.env.PRIVATE_KEY as `0x${string}` | undefined,
    rpcUrl: process.env.RPC_URL,
  });
}

program
  .name("skillproof")
  .description("ZK-Verified Agent Skill Proof CLI")
  .version("0.1.0");

program
  .command("register")
  .description("Register an agent identity on-chain")
  .argument("<agent-name>", "Agent name/identifier")
  .action(async (agentName: string) => {
    const client = getClient();
    console.log(`Registering agent "${agentName}"...`);
    const identityHash = computeIdentityHash(agentName);
    console.log(`Identity hash: ${identityHash}`);
    const txHash = await client.registerAgent(agentName);
    console.log(`Transaction: ${txHash}`);
    console.log("Agent registered successfully.");
  });

program
  .command("audit")
  .description("Generate a ZK proof for a skill audit")
  .requiredOption("--skill-source <value>", "Skill source identifier")
  .requiredOption("--nonce <value>", "Audit nonce")
  .requiredOption("--declared <value>", "Declared permissions (0-255 bitmask)")
  .requiredOption("--observed <value>", "Observed permissions (0-255 bitmask)")
  .requiredOption("--auditor-secret <value>", "Auditor secret")
  .requiredOption("--agent-id <value>", "Agent ID")
  .action(async (opts) => {
    const client = getClient();
    const input: SkillAuditInput = {
      skillSource: opts.skillSource,
      auditNonce: opts.nonce,
      declaredPermissions: opts.declared,
      observedPermissions: opts.observed,
      auditorSecret: opts.auditorSecret,
      agentId: opts.agentId,
      timestamp: Math.floor(Date.now() / 1000).toString(),
    };

    console.log("Generating ZK proof...");
    const proof = await client.generateProof(input);
    console.log("\nProof generated successfully.");
    console.log("Public signals:");
    console.log(`  skillHash:          ${proof.publicSignals[0]}`);
    console.log(`  permissionHash:     ${proof.publicSignals[1]}`);
    console.log(`  auditorCommitment:  ${proof.publicSignals[2]}`);
    console.log(`  agentIdHash:        ${proof.publicSignals[3]}`);
    console.log(`  timestamp:          ${proof.publicSignals[4]}`);

    // Output proof JSON for piping to `prove`
    console.log("\n--- PROOF JSON ---");
    console.log(JSON.stringify(proof));
  });

program
  .command("prove")
  .description("Submit a ZK proof on-chain")
  .requiredOption("--proof <json>", "Proof JSON (output from audit)")
  .requiredOption("--agent-name <name>", "Agent name for identity hash")
  .action(async (opts) => {
    const client = getClient();
    const proof = JSON.parse(opts.proof);
    const identityHash = computeIdentityHash(opts.agentName);

    console.log(`Submitting proof on-chain for "${opts.agentName}"...`);
    console.log(`Identity hash: ${identityHash}`);
    const txHash = await client.submitProof(proof, identityHash);
    console.log(`Transaction: ${txHash}`);
    console.log("Proof submitted successfully.");
  });

program
  .command("verify")
  .description("Check if an agent has a valid proof for a skill")
  .requiredOption("--agent-id-hash <hash>", "Agent ID hash (bytes32)")
  .requiredOption("--skill-hash <hash>", "Skill hash (bytes32)")
  .action(async (opts) => {
    const client = getClient();
    const valid = await client.hasValidProof(
      opts.agentIdHash as `0x${string}`,
      opts.skillHash as `0x${string}`
    );
    console.log(`Valid proof: ${valid}`);
    if (valid) {
      const record = await client.getProofRecord(
        opts.agentIdHash as `0x${string}`,
        opts.skillHash as `0x${string}`
      );
      console.log("Proof record:", record);
    }
  });

program
  .command("status")
  .description("Check agent registration status")
  .argument("<address>", "Agent wallet address")
  .action(async (address: string) => {
    const client = getClient();
    const registered = await client.isRegistered(address as `0x${string}`);
    console.log(`Address: ${address}`);
    console.log(`Registered: ${registered}`);
    if (registered) {
      const identity = await client.getIdentity(address as `0x${string}`);
      console.log("Identity:", identity);
    }
  });

program.parse();
