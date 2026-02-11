import type { PermissionName } from "./permissions";
import type { SkillAuditProof } from "@skillproof/sdk";

export interface SkillManifest {
  name: string;
  version: string;
  agentId: string;
  entrypoint: string;
  permissions: Partial<Record<PermissionName, boolean>>;
  timeout?: number;
}

export interface AuditLogEntry {
  timestamp: number;
  permission: PermissionName;
  module: string;
  method: string;
  args?: string[];
}

export interface AuditResult {
  declaredMask: number;
  observedMask: number;
  compliant: boolean;
  log: AuditLogEntry[];
}

export interface AuditAndProveResult extends AuditResult {
  proof: SkillAuditProof | null;
  proofError?: string;
}

export interface AuditOptions {
  allowExecution?: boolean;
  timeout?: number;
  circuitsBuildDir?: string;
}
