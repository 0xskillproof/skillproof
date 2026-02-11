const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  PERMISSION_BITS,
  ALL_PERMISSIONS,
  permissionBitValue,
  permissionsObjectToMask,
  maskToPermissionsObject,
  maskToPermissionNames,
  isSubsetMask,
} = require("../dist/permissions");

describe("permissions", () => {
  describe("PERMISSION_BITS", () => {
    it("should define 8 permission bits", () => {
      assert.equal(ALL_PERMISSIONS.length, 8);
    });

    it("should have unique bit positions 0-7", () => {
      const values = Object.values(PERMISSION_BITS);
      assert.deepEqual([...values].sort(), [0, 1, 2, 3, 4, 5, 6, 7]);
    });
  });

  describe("permissionBitValue", () => {
    it("should return correct bit values", () => {
      assert.equal(permissionBitValue("FILE_READ"), 1);
      assert.equal(permissionBitValue("FILE_WRITE"), 2);
      assert.equal(permissionBitValue("NETWORK_READ"), 4);
      assert.equal(permissionBitValue("NETWORK_WRITE"), 8);
      assert.equal(permissionBitValue("SHELL_EXEC"), 16);
      assert.equal(permissionBitValue("ENV_ACCESS"), 32);
      assert.equal(permissionBitValue("CRYPTO_OPS"), 64);
      assert.equal(permissionBitValue("SYSTEM_INFO"), 128);
    });
  });

  describe("permissionsObjectToMask", () => {
    it("should convert FILE_READ + NETWORK_READ to 5", () => {
      assert.equal(
        permissionsObjectToMask({ FILE_READ: true, NETWORK_READ: true }),
        5
      );
    });

    it("should return 0 for empty permissions", () => {
      assert.equal(permissionsObjectToMask({}), 0);
    });

    it("should ignore false values", () => {
      assert.equal(
        permissionsObjectToMask({ FILE_READ: true, FILE_WRITE: false }),
        1
      );
    });

    it("should handle all permissions", () => {
      const all = {};
      for (const name of ALL_PERMISSIONS) {
        all[name] = true;
      }
      assert.equal(permissionsObjectToMask(all), 255);
    });
  });

  describe("maskToPermissionsObject", () => {
    it("should convert mask 5 back to FILE_READ + NETWORK_READ", () => {
      const result = maskToPermissionsObject(5);
      assert.equal(result.FILE_READ, true);
      assert.equal(result.FILE_WRITE, false);
      assert.equal(result.NETWORK_READ, true);
      assert.equal(result.NETWORK_WRITE, false);
    });
  });

  describe("maskToPermissionNames", () => {
    it("should return names for set bits", () => {
      const names = maskToPermissionNames(5);
      assert.deepEqual(names, ["FILE_READ", "NETWORK_READ"]);
    });

    it("should return empty array for mask 0", () => {
      assert.deepEqual(maskToPermissionNames(0), []);
    });
  });

  describe("isSubsetMask", () => {
    it("should return true when observed is a subset of declared", () => {
      assert.equal(isSubsetMask(1, 5), true);   // FILE_READ subset of FILE_READ|NETWORK_READ
      assert.equal(isSubsetMask(5, 5), true);   // exact match
      assert.equal(isSubsetMask(0, 5), true);   // empty is subset of anything
    });

    it("should return false when observed exceeds declared", () => {
      assert.equal(isSubsetMask(3, 1), false);  // FILE_READ|FILE_WRITE not subset of FILE_READ
      assert.equal(isSubsetMask(19, 1), false); // FILE_READ|FILE_WRITE|SHELL_EXEC not subset of FILE_READ
    });
  });
});
