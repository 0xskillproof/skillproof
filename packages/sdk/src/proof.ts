import * as snarkjs from "snarkjs";
import * as path from "path";

export interface SkillAuditInput {
  skillSource: string;
  auditNonce: string;
  declaredPermissions: string;
  observedPermissions: string;
  auditorSecret: string;
  agentId: string;
  timestamp: string;
}

export interface SkillAuditProof {
  pA: [string, string];
  pB: [[string, string], [string, string]];
  pC: [string, string];
  publicSignals: string[];
}

const DEFAULT_CIRCUITS_BUILD = path.join(
  __dirname, "..", "..", "circuits", "build"
);

export async function generateProof(
  input: SkillAuditInput,
  circuitsBuildDir: string = DEFAULT_CIRCUITS_BUILD
): Promise<SkillAuditProof> {
  const wasmPath = path.join(circuitsBuildDir, "skill-audit_js", "skill-audit.wasm");
  const zkeyPath = path.join(circuitsBuildDir, "skill-audit_final.zkey");

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    input as unknown as Record<string, string>, wasmPath, zkeyPath
  );

  const calldata = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);
  const [pA, pB, pC, pubSignals] = JSON.parse(`[${calldata}]`);

  return { pA, pB, pC, publicSignals: pubSignals };
}

export async function verifyProofOffchain(
  proof: SkillAuditProof,
  circuitsBuildDir: string = DEFAULT_CIRCUITS_BUILD
): Promise<boolean> {
  const fs = await import("fs");
  const vkeyPath = path.join(circuitsBuildDir, "verification_key.json");
  const vKey = JSON.parse(fs.readFileSync(vkeyPath, "utf8"));

  // Reconstruct proof object from Solidity calldata format
  const snarkProof = {
    pi_a: [...proof.pA, "1"],
    pi_b: [
      [...proof.pB[0]].reverse(),
      [...proof.pB[1]].reverse(),
      ["1", "0"],
    ],
    pi_c: [...proof.pC, "1"],
    protocol: "groth16" as const,
    curve: "bn128" as const,
  };

  return snarkjs.groth16.verify(vKey, proof.publicSignals, snarkProof);
}
