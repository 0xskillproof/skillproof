import { type PermissionName, permissionBitValue } from "../permissions";
import type { AuditLogEntry } from "../types";

export class PermissionTracker {
  private _mask: number = 0;
  private _log: AuditLogEntry[] = [];

  record(permission: PermissionName, module: string, method: string, args?: string[]): void {
    this._mask |= permissionBitValue(permission);
    this._log.push({
      timestamp: Date.now(),
      permission,
      module,
      method,
      args,
    });
  }

  get mask(): number {
    return this._mask;
  }

  get log(): AuditLogEntry[] {
    return [...this._log];
  }

  reset(): void {
    this._mask = 0;
    this._log = [];
  }
}
