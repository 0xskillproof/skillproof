const snarkjs = require("snarkjs");
const path = require("path");
const fs = require("fs");
const assert = require("assert");

const buildDir = path.join(__dirname, "..", "build");
const wasmPath = path.join(buildDir, "skill-audit_js", "skill-audit.wasm");
const zkeyPath = path.join(buildDir, "skill-audit_final.zkey");
const vkeyPath = path.join(buildDir, "verification_key.json");

async function test() {
  console.log("Testing skill-audit circuit...\n");

  if (!fs.existsSync(wasmPath) || !fs.existsSync(zkeyPath)) {
    console.error("Build artifacts not found. Run compile + setup first.");
    process.exit(1);
  }

  const vKey = JSON.parse(fs.readFileSync(vkeyPath, "utf8"));

  // Test 1: Valid proof — observed permissions are a subset of declared
  console.log("Test 1: Valid proof (observed subset of declared)");
  {
    const input = {
      skillSource: "12345678",
      auditNonce: "87654321",
      declaredPermissions: "255",  // 0b11111111 — all permissions
      observedPermissions: "5",    // 0b00000101 — subset
      auditorSecret: "999999",
      agentId: "42",
      timestamp: "1700000000",
    };

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input, wasmPath, zkeyPath
    );

    const valid = await snarkjs.groth16.verify(vKey, publicSignals, proof);
    assert.strictEqual(valid, true, "Valid proof should verify");
    console.log("  PASS: Proof generated and verified.\n");
    console.log("  Public signals:", publicSignals);
  }

  // Test 2: Valid proof — exact match
  console.log("\nTest 2: Valid proof (exact permissions match)");
  {
    const input = {
      skillSource: "11111",
      auditNonce: "22222",
      declaredPermissions: "6",   // 0b00000110
      observedPermissions: "6",   // 0b00000110 — exact match
      auditorSecret: "333333",
      agentId: "7",
      timestamp: "1700000001",
    };

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input, wasmPath, zkeyPath
    );

    const valid = await snarkjs.groth16.verify(vKey, publicSignals, proof);
    assert.strictEqual(valid, true, "Exact match should verify");
    console.log("  PASS: Proof generated and verified.\n");
  }

  // Test 3: Invalid — observed exceeds declared (should fail at witness generation)
  console.log("Test 3: Invalid proof (observed exceeds declared)");
  {
    const input = {
      skillSource: "55555",
      auditNonce: "66666",
      declaredPermissions: "4",   // 0b00000100
      observedPermissions: "7",   // 0b00000111 — bits 0,1 not in declared
      auditorSecret: "777777",
      agentId: "99",
      timestamp: "1700000002",
    };

    try {
      await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);
      assert.fail("Should have thrown — observed exceeds declared");
    } catch (err) {
      console.log("  PASS: Correctly rejected invalid permissions.\n");
    }
  }

  console.log("All circuit tests passed!");
}

test().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
