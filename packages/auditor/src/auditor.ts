import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { loadManifest } from "./manifest";
import { SandboxRunner } from "./sandbox";
import type { AuditResult, AuditAndProveResult, AuditOptions } from "./types";

export class SkillAuditor {
  private readonly runner: SandboxRunner;
  private readonly circuitsBuildDir?: string;

  constructor(options: AuditOptions = {}) {
    this.runner = new SandboxRunner({
      allowExecution: options.allowExecution ?? false,
      timeout: options.timeout,
    });
    this.circuitsBuildDir = options.circuitsBuildDir;
  }

  async audit(manifestPath: string): Promise<AuditResult> {
    const manifest = loadManifest(manifestPath);
    const skillDir = path.dirname(path.resolve(manifestPath));
    return this.runner.run(manifest, skillDir);
  }

  async auditAndProve(
    manifestPath: string,
    options: { auditorSecret: string }
  ): Promise<AuditAndProveResult> {
    const manifest = loadManifest(manifestPath);
    const skillDir = path.dirname(path.resolve(manifestPath));
    const auditResult = await this.runner.run(manifest, skillDir);

    if (!auditResult.compliant) {
      return {
        ...auditResult,
        proof: null,
        proofError: `Skill is non-compliant: observed permissions (${auditResult.observedMask}) exceed declared permissions (${auditResult.declaredMask})`,
      };
    }

    try {
      const { generateProof } = await import("@skillproof/sdk");

      // Read skill source and hash it, truncated to 64 bits for field safety
      const entrypointPath = path.resolve(skillDir, manifest.entrypoint);
      const skillSource = fs.readFileSync(entrypointPath, "utf-8");
      const fullHash = crypto.createHash("sha256").update(skillSource).digest("hex");
      const skillSourceField = BigInt("0x" + fullHash.slice(0, 16)).toString();

      const nonce = BigInt("0x" + crypto.randomBytes(8).toString("hex")).toString();
      const timestamp = Math.floor(Date.now() / 1000).toString();

      const proof = await generateProof(
        {
          skillSource: skillSourceField,
          auditNonce: nonce,
          declaredPermissions: auditResult.declaredMask.toString(),
          observedPermissions: auditResult.observedMask.toString(),
          auditorSecret: options.auditorSecret,
          agentId: manifest.agentId,
          timestamp,
        },
        this.circuitsBuildDir
      );

      return {
        ...auditResult,
        proof,
      };
    } catch (err) {
      return {
        ...auditResult,
        proof: null,
        proofError: `Failed to generate proof: ${(err as Error).message}`,
      };
    }
  }
}
