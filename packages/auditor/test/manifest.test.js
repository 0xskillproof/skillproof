const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const { loadManifest, validateManifest, ManifestValidationError } = require("../dist/manifest");

describe("manifest", () => {
  describe("loadManifest", () => {
    it("should load a valid manifest", () => {
      const manifestPath = path.join(__dirname, "fixtures", "compliant-skill", "manifest.json");
      const manifest = loadManifest(manifestPath);
      assert.equal(manifest.name, "file-reader-skill");
      assert.equal(manifest.version, "1.0.0");
      assert.equal(manifest.agentId, "42");
      assert.equal(manifest.entrypoint, "index.js");
      assert.deepEqual(manifest.permissions, { FILE_READ: true });
      assert.equal(manifest.timeout, 5000);
    });

    it("should throw for missing manifest file", () => {
      assert.throws(
        () => loadManifest("/nonexistent/manifest.json"),
        /not found/
      );
    });
  });

  describe("validateManifest", () => {
    it("should accept a valid manifest object", () => {
      const manifest = validateManifest({
        name: "test-skill",
        version: "1.0.0",
        agentId: "1",
        entrypoint: "index.js",
        permissions: {},
      });
      assert.equal(manifest.name, "test-skill");
    });

    it("should reject missing required fields", () => {
      assert.throws(
        () => validateManifest({ name: "test" }),
        ManifestValidationError
      );
    });

    it("should reject unknown permission names", () => {
      assert.throws(
        () =>
          validateManifest({
            name: "test",
            version: "1.0.0",
            agentId: "1",
            entrypoint: "index.js",
            permissions: { UNKNOWN_PERM: true },
          }),
        /Unknown permission/
      );
    });

    it("should reject non-boolean permission values", () => {
      assert.throws(
        () =>
          validateManifest({
            name: "test",
            version: "1.0.0",
            agentId: "1",
            entrypoint: "index.js",
            permissions: { FILE_READ: "yes" },
          }),
        /must be a boolean/
      );
    });

    it("should reject invalid version format", () => {
      assert.throws(
        () =>
          validateManifest({
            name: "test",
            version: "abc",
            agentId: "1",
            entrypoint: "index.js",
            permissions: {},
          }),
        /semver/
      );
    });

    it("should reject unknown fields", () => {
      assert.throws(
        () =>
          validateManifest({
            name: "test",
            version: "1.0.0",
            agentId: "1",
            entrypoint: "index.js",
            permissions: {},
            extraField: true,
          }),
        /Unknown field/
      );
    });

    it("should reject non-object input", () => {
      assert.throws(
        () => validateManifest("not an object"),
        /must be a JSON object/
      );
    });

    it("should reject invalid timeout", () => {
      assert.throws(
        () =>
          validateManifest({
            name: "test",
            version: "1.0.0",
            agentId: "1",
            entrypoint: "index.js",
            permissions: {},
            timeout: 50,
          }),
        /timeout/
      );
    });
  });
});
