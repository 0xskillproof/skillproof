const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const { SandboxRunner } = require("../dist/sandbox");
const { loadManifest } = require("../dist/manifest");

const fixturesDir = path.join(__dirname, "fixtures");

describe("SandboxRunner", () => {
  const runner = new SandboxRunner({ allowExecution: false, timeout: 5000 });

  describe("compliant skill", () => {
    it("should detect FILE_READ only (observedMask=1, declaredMask=1, compliant=true)", async () => {
      const manifestPath = path.join(fixturesDir, "compliant-skill", "manifest.json");
      const manifest = loadManifest(manifestPath);
      const result = await runner.run(manifest, path.dirname(manifestPath));

      assert.equal(result.observedMask, 1, "observedMask should be 1 (FILE_READ)");
      assert.equal(result.declaredMask, 1, "declaredMask should be 1 (FILE_READ)");
      assert.equal(result.compliant, true);
      assert.ok(result.log.length > 0, "should have log entries");
      assert.equal(result.log[0].permission, "FILE_READ");
      assert.equal(result.log[0].module, "fs");
      assert.equal(result.log[0].method, "readFileSync");
    });
  });

  describe("non-compliant skill", () => {
    it("should detect FILE_READ|FILE_WRITE|SHELL_EXEC (observedMask=19, declaredMask=1, compliant=false)", async () => {
      const manifestPath = path.join(fixturesDir, "non-compliant-skill", "manifest.json");
      const manifest = loadManifest(manifestPath);
      const result = await runner.run(manifest, path.dirname(manifestPath));

      assert.equal(result.observedMask, 19, "observedMask should be 19 (FILE_READ|FILE_WRITE|SHELL_EXEC)");
      assert.equal(result.declaredMask, 1, "declaredMask should be 1 (FILE_READ)");
      assert.equal(result.compliant, false);

      const permissions = result.log.map((e) => e.permission);
      assert.ok(permissions.includes("FILE_READ"), "should log FILE_READ");
      assert.ok(permissions.includes("FILE_WRITE"), "should log FILE_WRITE");
      assert.ok(permissions.includes("SHELL_EXEC"), "should log SHELL_EXEC");
    });
  });

  describe("minimal skill", () => {
    it("should detect no permissions (observedMask=0, declaredMask=0, compliant=true)", async () => {
      const manifestPath = path.join(fixturesDir, "minimal-skill", "manifest.json");
      const manifest = loadManifest(manifestPath);
      const result = await runner.run(manifest, path.dirname(manifestPath));

      assert.equal(result.observedMask, 0, "observedMask should be 0");
      assert.equal(result.declaredMask, 0, "declaredMask should be 0");
      assert.equal(result.compliant, true);
      assert.equal(result.log.length, 0, "should have no log entries");
    });
  });

  describe("missing entrypoint", () => {
    it("should throw for missing entrypoint file", async () => {
      const manifest = {
        name: "missing",
        version: "1.0.0",
        agentId: "1",
        entrypoint: "nonexistent.js",
        permissions: {},
      };
      await assert.rejects(
        () => runner.run(manifest, fixturesDir),
        /not found/
      );
    });
  });
});
