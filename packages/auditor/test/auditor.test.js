const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const { SkillAuditor } = require("../dist/auditor");

const fixturesDir = path.join(__dirname, "fixtures");

describe("SkillAuditor", () => {
  const auditor = new SkillAuditor({ allowExecution: false, timeout: 5000 });

  describe("audit()", () => {
    it("should audit a compliant skill", async () => {
      const manifestPath = path.join(fixturesDir, "compliant-skill", "manifest.json");
      const result = await auditor.audit(manifestPath);

      assert.equal(result.declaredMask, 1);
      assert.equal(result.observedMask, 1);
      assert.equal(result.compliant, true);
    });

    it("should audit a non-compliant skill", async () => {
      const manifestPath = path.join(fixturesDir, "non-compliant-skill", "manifest.json");
      const result = await auditor.audit(manifestPath);

      assert.equal(result.declaredMask, 1);
      assert.equal(result.observedMask, 19);
      assert.equal(result.compliant, false);
    });

    it("should audit a minimal skill", async () => {
      const manifestPath = path.join(fixturesDir, "minimal-skill", "manifest.json");
      const result = await auditor.audit(manifestPath);

      assert.equal(result.declaredMask, 0);
      assert.equal(result.observedMask, 0);
      assert.equal(result.compliant, true);
    });

    it("should throw for invalid manifest", async () => {
      await assert.rejects(
        () => auditor.audit("/nonexistent/manifest.json"),
        /not found/
      );
    });
  });

  describe("auditAndProve()", () => {
    it("should return proofError for non-compliant skill", async () => {
      const manifestPath = path.join(fixturesDir, "non-compliant-skill", "manifest.json");
      const result = await auditor.auditAndProve(manifestPath, {
        auditorSecret: "12345",
      });

      assert.equal(result.compliant, false);
      assert.equal(result.proof, null);
      assert.ok(result.proofError);
      assert.ok(result.proofError.includes("non-compliant"));
    });

    it("should attempt proof generation for compliant skill (may fail without circuits)", async () => {
      const manifestPath = path.join(fixturesDir, "compliant-skill", "manifest.json");
      const result = await auditor.auditAndProve(manifestPath, {
        auditorSecret: "12345",
      });

      assert.equal(result.compliant, true);
      assert.equal(result.declaredMask, 1);
      assert.equal(result.observedMask, 1);

      // Without built circuits, proof generation will fail gracefully
      if (result.proof === null) {
        assert.ok(result.proofError, "should have proofError explaining failure");
        assert.ok(result.proofError.includes("Failed to generate proof"));
      } else {
        // If circuits are available, proof should have the expected shape
        assert.ok(result.proof.pA);
        assert.ok(result.proof.pB);
        assert.ok(result.proof.pC);
        assert.ok(result.proof.publicSignals);
      }
    });
  });
});
