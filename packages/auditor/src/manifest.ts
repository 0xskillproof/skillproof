import * as fs from "fs";
import * as path from "path";
import type { SkillManifest } from "./types";
import { ALL_PERMISSIONS, type PermissionName } from "./permissions";
import schema from "./schema/skill-manifest.schema.json";

export class ManifestValidationError extends Error {
  constructor(
    message: string,
    public readonly errors: string[]
  ) {
    super(message);
    this.name = "ManifestValidationError";
  }
}

function validateAgainstSchema(data: unknown): string[] {
  const errors: string[] = [];
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    errors.push("Manifest must be a JSON object");
    return errors;
  }

  const obj = data as Record<string, unknown>;

  for (const field of schema.required) {
    if (!(field in obj)) {
      errors.push(`Missing required field: "${field}"`);
    }
  }

  if (typeof obj.name !== "string" || obj.name.length < 1) {
    errors.push('"name" must be a non-empty string');
  }

  if (typeof obj.version !== "string" || !/^\d+\.\d+\.\d+/.test(obj.version)) {
    errors.push('"version" must be a semver string (e.g. "1.0.0")');
  }

  if (typeof obj.agentId !== "string" || obj.agentId.length < 1) {
    errors.push('"agentId" must be a non-empty string');
  }

  if (typeof obj.entrypoint !== "string" || obj.entrypoint.length < 1) {
    errors.push('"entrypoint" must be a non-empty string');
  }

  if (typeof obj.permissions !== "object" || obj.permissions === null || Array.isArray(obj.permissions)) {
    errors.push('"permissions" must be an object');
  } else {
    const perms = obj.permissions as Record<string, unknown>;
    for (const key of Object.keys(perms)) {
      if (!ALL_PERMISSIONS.includes(key as PermissionName)) {
        errors.push(`Unknown permission: "${key}"`);
      } else if (typeof perms[key] !== "boolean") {
        errors.push(`Permission "${key}" must be a boolean`);
      }
    }
  }

  if ("timeout" in obj && obj.timeout !== undefined) {
    if (typeof obj.timeout !== "number" || obj.timeout < 100 || obj.timeout > 60000) {
      errors.push('"timeout" must be a number between 100 and 60000');
    }
  }

  const allowedKeys = new Set(Object.keys(schema.properties));
  for (const key of Object.keys(obj)) {
    if (!allowedKeys.has(key)) {
      errors.push(`Unknown field: "${key}"`);
    }
  }

  return errors;
}

export function validateManifest(data: unknown): SkillManifest {
  const errors = validateAgainstSchema(data);
  if (errors.length > 0) {
    throw new ManifestValidationError(
      `Invalid skill manifest: ${errors.join("; ")}`,
      errors
    );
  }
  return data as SkillManifest;
}

export function loadManifest(manifestPath: string): SkillManifest {
  const absPath = path.resolve(manifestPath);

  if (!fs.existsSync(absPath)) {
    throw new Error(`Manifest file not found: ${absPath}`);
  }

  let raw: string;
  try {
    raw = fs.readFileSync(absPath, "utf-8");
  } catch (err) {
    throw new Error(`Failed to read manifest: ${(err as Error).message}`);
  }

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Invalid JSON in manifest: ${(err as Error).message}`);
  }

  return validateManifest(data);
}
