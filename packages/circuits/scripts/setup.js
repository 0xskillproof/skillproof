const snarkjs = require("snarkjs");
const { getCurveFromName } = require("snarkjs").curves;
const path = require("path");
const fs = require("fs");

const buildDir = path.join(__dirname, "..", "build");

async function main() {
  const r1csPath = path.join(buildDir, "skill-audit.r1cs");
  const wasmPath = path.join(buildDir, "skill-audit_js", "skill-audit.wasm");

  if (!fs.existsSync(r1csPath)) {
    console.error("R1CS not found. Run `npm run compile` first.");
    process.exit(1);
  }

  console.log("Starting powers of tau ceremony (BN128, 2^12)...");
  const curve = await getCurveFromName("bn128");
  await snarkjs.powersOfTau.newAccumulator(
    curve, 12,
    path.join(buildDir, "pot12_0000.ptau")
  );

  await snarkjs.powersOfTau.contribute(
    path.join(buildDir, "pot12_0000.ptau"),
    path.join(buildDir, "pot12_0001.ptau"),
    "skillproof-contribution",
    "skillproof-random-entropy-string-for-dev"
  );

  await snarkjs.powersOfTau.preparePhase2(
    path.join(buildDir, "pot12_0001.ptau"),
    path.join(buildDir, "pot12_final.ptau")
  );

  console.log("Generating Groth16 proving key...");
  await snarkjs.zKey.newZKey(
    r1csPath,
    path.join(buildDir, "pot12_final.ptau"),
    path.join(buildDir, "skill-audit_0000.zkey")
  );

  await snarkjs.zKey.contribute(
    path.join(buildDir, "skill-audit_0000.zkey"),
    path.join(buildDir, "skill-audit_final.zkey"),
    "skillproof-phase2",
    "skillproof-phase2-entropy-string-for-dev"
  );

  console.log("Exporting verification key...");
  const vKey = await snarkjs.zKey.exportVerificationKey(
    path.join(buildDir, "skill-audit_final.zkey")
  );
  fs.writeFileSync(
    path.join(buildDir, "verification_key.json"),
    JSON.stringify(vKey, null, 2)
  );

  console.log("Trusted setup complete.");
  console.log(`  zkey: ${path.join(buildDir, "skill-audit_final.zkey")}`);
  console.log(`  vkey: ${path.join(buildDir, "verification_key.json")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
