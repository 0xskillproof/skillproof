const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const path = require("path");
const fs = require("fs");

const CIRCUITS_BUILD = path.join(__dirname, "..", "..", "circuits", "build");
const AUDITOR_DIST = path.join(__dirname, "..", "..", "auditor", "dist");
const FIXTURES = path.join(__dirname, "..", "..", "auditor", "test", "fixtures");

describe("End-to-End Integration", function () {
  this.timeout(120000);

  let identityRegistry, validationRegistry, groth16Verifier, zkSkillVerifier;
  let deployer;
  let SkillAuditor, maskToPermissionNames;

  before(async function () {
    // Check circuit build exists
    const wasmPath = path.join(CIRCUITS_BUILD, "skill-audit_js", "skill-audit.wasm");
    if (!fs.existsSync(wasmPath)) {
      this.skip("Circuit build not found — run `npm run compile && npm run setup` in packages/circuits");
    }

    // Check auditor dist exists
    const auditorPath = path.join(AUDITOR_DIST, "auditor.js");
    if (!fs.existsSync(auditorPath)) {
      this.skip("Auditor not built — run `npm run build` in packages/auditor");
    }

    // Load auditor dynamically (it's a TypeScript package compiled to dist/)
    const auditor = require(AUDITOR_DIST);
    SkillAuditor = auditor.SkillAuditor;
    maskToPermissionNames = auditor.maskToPermissionNames;

    [deployer] = await ethers.getSigners();

    // Deploy all contracts
    const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
    identityRegistry = await upgrades.deployProxy(IdentityRegistry, [], { kind: "uups" });
    await identityRegistry.waitForDeployment();

    const ReputationRegistry = await ethers.getContractFactory("ReputationRegistry");
    const reputationRegistry = await upgrades.deployProxy(ReputationRegistry, [], { kind: "uups" });
    await reputationRegistry.waitForDeployment();

    const ValidationRegistry = await ethers.getContractFactory("ValidationRegistry");
    validationRegistry = await upgrades.deployProxy(ValidationRegistry, [], { kind: "uups" });
    await validationRegistry.waitForDeployment();

    const Groth16Verifier = await ethers.getContractFactory("Groth16Verifier");
    groth16Verifier = await Groth16Verifier.deploy();
    await groth16Verifier.waitForDeployment();

    const ZKSkillVerifier = await ethers.getContractFactory("ZKSkillVerifier");
    zkSkillVerifier = await ZKSkillVerifier.deploy(
      await groth16Verifier.getAddress(),
      await validationRegistry.getAddress()
    );
    await zkSkillVerifier.waitForDeployment();

    await validationRegistry.setAuthorizedValidator(await zkSkillVerifier.getAddress(), true);
    await reputationRegistry.setAuthorizedUpdater(await zkSkillVerifier.getAddress(), true);
  });

  it("compliant skill: audit → prove → submit on-chain → verify", async function () {
    const manifestPath = path.join(FIXTURES, "compliant-skill", "manifest.json");
    const auditor = new SkillAuditor({
      circuitsBuildDir: CIRCUITS_BUILD,
    });

    // Step 1: Audit and generate proof
    const result = await auditor.auditAndProve(manifestPath, {
      auditorSecret: "42424242",
    });

    expect(result.compliant).to.be.true;
    expect(result.declaredMask).to.equal(1);
    expect(result.observedMask).to.equal(1);
    expect(result.proof).to.not.be.null;
    expect(result.proof.pA).to.have.lengthOf(2);
    expect(result.proof.pB).to.have.lengthOf(2);
    expect(result.proof.pC).to.have.lengthOf(2);
    expect(result.proof.publicSignals).to.have.lengthOf(6);

    // Step 2: Submit proof on-chain
    const identityHash = ethers.keccak256(ethers.toUtf8Bytes("agent-42"));
    const tx = await zkSkillVerifier.submitProof(
      result.proof.pA,
      result.proof.pB,
      result.proof.pC,
      result.proof.publicSignals,
      identityHash
    );
    const receipt = await tx.wait();
    expect(receipt.status).to.equal(1);

    // Step 3: Verify on-chain
    const skillHash = ethers.toBeHex(result.proof.publicSignals[0], 32);
    const agentIdHash = ethers.toBeHex(result.proof.publicSignals[3], 32);

    expect(await zkSkillVerifier.hasValidProof(agentIdHash, skillHash)).to.be.true;
    expect(await validationRegistry.hasValidation(identityHash, skillHash)).to.be.true;

    // Step 4: Retrieve proof record
    const record = await zkSkillVerifier.getProofRecord(agentIdHash, skillHash);
    expect(record.verified).to.be.true;
    expect(record.skillHash).to.equal(skillHash);
  });

  it("non-compliant skill: audit fails, no proof generated", async function () {
    const manifestPath = path.join(FIXTURES, "non-compliant-skill", "manifest.json");
    const auditor = new SkillAuditor({
      circuitsBuildDir: CIRCUITS_BUILD,
    });

    const result = await auditor.auditAndProve(manifestPath, {
      auditorSecret: "42424242",
    });

    expect(result.compliant).to.be.false;
    expect(result.observedMask).to.equal(19); // FILE_READ | FILE_WRITE | SHELL_EXEC
    expect(result.declaredMask).to.equal(1);  // FILE_READ only
    expect(result.proof).to.be.null;
    expect(result.proofError).to.include("non-compliant");
  });

  it("minimal skill: audit passes, proof generated", async function () {
    const manifestPath = path.join(FIXTURES, "minimal-skill", "manifest.json");
    const auditor = new SkillAuditor({
      circuitsBuildDir: CIRCUITS_BUILD,
    });

    const result = await auditor.auditAndProve(manifestPath, {
      auditorSecret: "99999999",
    });

    expect(result.compliant).to.be.true;
    expect(result.observedMask).to.equal(0);
    expect(result.declaredMask).to.equal(0);
    expect(result.proof).to.not.be.null;

    // Submit this one on-chain too
    const identityHash = ethers.keccak256(ethers.toUtf8Bytes("agent-42-minimal"));
    const tx = await zkSkillVerifier.submitProof(
      result.proof.pA,
      result.proof.pB,
      result.proof.pC,
      result.proof.publicSignals,
      identityHash
    );
    const receipt = await tx.wait();
    expect(receipt.status).to.equal(1);
  });

  it("offline verification: proof verifiable without blockchain", async function () {
    const manifestPath = path.join(FIXTURES, "compliant-skill", "manifest.json");
    const auditor = new SkillAuditor({
      circuitsBuildDir: CIRCUITS_BUILD,
    });

    const result = await auditor.auditAndProve(manifestPath, {
      auditorSecret: "77777777",
    });

    expect(result.proof).to.not.be.null;

    // Verify offline using SDK
    const { verifyProofOffchain } = require(path.join(__dirname, "..", "..", "sdk", "dist", "proof"));
    const valid = await verifyProofOffchain(result.proof, CIRCUITS_BUILD);
    expect(valid).to.be.true;
  });
});
