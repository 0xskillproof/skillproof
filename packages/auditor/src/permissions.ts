export const PERMISSION_BITS = {
  FILE_READ: 0,
  FILE_WRITE: 1,
  NETWORK_READ: 2,
  NETWORK_WRITE: 3,
  SHELL_EXEC: 4,
  ENV_ACCESS: 5,
  CRYPTO_OPS: 6,
  SYSTEM_INFO: 7,
} as const;

export type PermissionName = keyof typeof PERMISSION_BITS;

export const ALL_PERMISSIONS: PermissionName[] = Object.keys(PERMISSION_BITS) as PermissionName[];

export function permissionBitValue(name: PermissionName): number {
  return 1 << PERMISSION_BITS[name];
}

export function permissionsObjectToMask(perms: Partial<Record<PermissionName, boolean>>): number {
  let mask = 0;
  for (const [name, enabled] of Object.entries(perms)) {
    if (enabled && name in PERMISSION_BITS) {
      mask |= 1 << PERMISSION_BITS[name as PermissionName];
    }
  }
  return mask;
}

export function maskToPermissionsObject(mask: number): Record<PermissionName, boolean> {
  const result = {} as Record<PermissionName, boolean>;
  for (const name of ALL_PERMISSIONS) {
    result[name] = (mask & (1 << PERMISSION_BITS[name])) !== 0;
  }
  return result;
}

export function maskToPermissionNames(mask: number): PermissionName[] {
  return ALL_PERMISSIONS.filter((name) => (mask & (1 << PERMISSION_BITS[name])) !== 0);
}

export function isSubsetMask(observed: number, declared: number): boolean {
  return (observed & ~declared) === 0;
}
