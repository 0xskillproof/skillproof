const snarkjs = require("snarkjs");
const path = require("path");
const fs = require("fs");

const buildDir = path.join(__dirname, "..", "build");
const contractsDir = path.join(__dirname, "..", "..", "contracts", "contracts");

async function main() {
  const zkeyPath = path.join(buildDir, "skill-audit_final.zkey");
  if (!fs.existsSync(zkeyPath)) {
    console.error("zkey not found. Run `npm run setup` first.");
    process.exit(1);
  }

  console.log("Exporting Solidity verifier...");
  const snarkjsRoot = path.join(path.dirname(require.resolve("snarkjs")), "..");
  const templates = {
    groth16: fs.readFileSync(path.join(snarkjsRoot, "templates", "verifier_groth16.sol.ejs"), "utf8"),
  };
  const solidityVerifier = await snarkjs.zKey.exportSolidityVerifier(
    zkeyPath,
    templates
  );

  const outputPath = path.join(contractsDir, "SkillAuditVerifier.sol");
  fs.mkdirSync(contractsDir, { recursive: true });
  fs.writeFileSync(outputPath, solidityVerifier);

  console.log(`Verifier written to: ${outputPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
