const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const circuitDir = path.join(__dirname, "..", "circuits");
const buildDir = path.join(__dirname, "..", "build");

fs.mkdirSync(buildDir, { recursive: true });

console.log("Compiling skill-audit.circom...");
execSync(
  `circom ${path.join(circuitDir, "skill-audit.circom")} --r1cs --wasm --sym -o ${buildDir} -l ${path.join(__dirname, "..", "..", "..", "node_modules")}`,
  { stdio: "inherit" }
);

console.log("Circuit compiled successfully.");
console.log(`  R1CS: ${path.join(buildDir, "skill-audit.r1cs")}`);
console.log(`  WASM: ${path.join(buildDir, "skill-audit_js/skill-audit.wasm")}`);
