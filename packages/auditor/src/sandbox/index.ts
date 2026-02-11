import * as vm from "vm";
import * as fs from "fs";
import * as path from "path";
import { PermissionTracker } from "./permission-tracker";
import { buildSandboxContext } from "./sandbox-context";
import type { AuditResult } from "../types";
import { permissionsObjectToMask, isSubsetMask } from "../permissions";
import type { SkillManifest } from "../types";

export interface SandboxRunnerOptions {
  allowExecution?: boolean;
  timeout?: number;
}

export class SandboxRunner {
  private readonly allowExecution: boolean;
  private readonly timeout: number;

  constructor(options: SandboxRunnerOptions = {}) {
    this.allowExecution = options.allowExecution ?? false;
    this.timeout = options.timeout ?? 5000;
  }

  async run(manifest: SkillManifest, skillDir: string): Promise<AuditResult> {
    const tracker = new PermissionTracker();
    const declaredMask = permissionsObjectToMask(manifest.permissions);

    const entrypointPath = path.resolve(skillDir, manifest.entrypoint);
    if (!fs.existsSync(entrypointPath)) {
      throw new Error(`Skill entrypoint not found: ${entrypointPath}`);
    }

    const skillSource = fs.readFileSync(entrypointPath, "utf-8");
    const context = buildSandboxContext(tracker, this.allowExecution);
    const timeout = manifest.timeout ?? this.timeout;

    const wrappedSource = `
      (async function() {
        ${skillSource}
      })();
    `;

    const script = new vm.Script(wrappedSource, {
      filename: manifest.entrypoint,
    });

    try {
      const result = script.runInContext(context, { timeout });

      // Handle async skills via Promise.race with timeout
      if (result && typeof result === "object" && typeof (result as Promise<unknown>).then === "function") {
        await Promise.race([
          result,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Skill execution timed out")), timeout)
          ),
        ]);
      }
    } catch (err) {
      const message = (err as Error).message || "";
      // Timeouts are expected for long-running skills — swallow them
      // Other errors (e.g. TypeError from using undefined return values) are
      // expected when allowExecution is false, since stubs return undefined
      if (!message.includes("timed out")) {
        // Skill code errors are non-fatal; we still report observed permissions
      }
    }

    const observedMask = tracker.mask;
    const compliant = isSubsetMask(observedMask, declaredMask);

    return {
      declaredMask,
      observedMask,
      compliant,
      log: tracker.log,
    };
  }
}

export { PermissionTracker } from "./permission-tracker";
export { createModuleProxies, createProcessProxy } from "./module-proxy";
export { buildSandboxContext } from "./sandbox-context";
