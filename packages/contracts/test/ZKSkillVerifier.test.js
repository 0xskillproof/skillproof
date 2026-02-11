const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const snarkjs = require("snarkjs");
const path = require("path");

const CIRCUITS_BUILD = path.join(__dirname, "..", "..", "circuits", "build");
const WASM_PATH = path.join(CIRCUITS_BUILD, "skill-audit_js", "skill-audit.wasm");
const ZKEY_PATH = path.join(CIRCUITS_BUILD, "skill-audit_final.zkey");

describe("ZKSkillVerifier", function () {
  let identityRegistry, reputationRegistry, validationRegistry;
  let groth16Verifier, zkSkillVerifier;
  let deployer, agent;

  before(async function () {
    [deployer, agent] = await ethers.getSigners();

    // Deploy ERC-8004 registries
    const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
    identityRegistry = await upgrades.deployProxy(IdentityRegistry, [], { kind: "uups" });
    await identityRegistry.waitForDeployment();

    const ReputationRegistry = await ethers.getContractFactory("ReputationRegistry");
    reputationRegistry = await upgrades.deployProxy(ReputationRegistry, [], { kind: "uups" });
    await reputationRegistry.waitForDeployment();

    const ValidationRegistry = await ethers.getContractFactory("ValidationRegistry");
    validationRegistry = await upgrades.deployProxy(ValidationRegistry, [], { kind: "uups" });
    await validationRegistry.waitForDeployment();

    // Deploy Groth16 verifier
    const Groth16Verifier = await ethers.getContractFactory("Groth16Verifier");
    groth16Verifier = await Groth16Verifier.deploy();
    await groth16Verifier.waitForDeployment();

    // Deploy ZKSkillVerifier
    const ZKSkillVerifier = await ethers.getContractFactory("ZKSkillVerifier");
    zkSkillVerifier = await ZKSkillVerifier.deploy(
      await groth16Verifier.getAddress(),
      await validationRegistry.getAddress()
    );
    await zkSkillVerifier.waitForDeployment();

    // Authorize ZKSkillVerifier
    await validationRegistry.setAuthorizedValidator(await zkSkillVerifier.getAddress(), true);
  });

  it("should deploy all contracts", async function () {
    expect(await identityRegistry.getAddress()).to.be.properAddress;
    expect(await reputationRegistry.getAddress()).to.be.properAddress;
    expect(await validationRegistry.getAddress()).to.be.properAddress;
    expect(await groth16Verifier.getAddress()).to.be.properAddress;
    expect(await zkSkillVerifier.getAddress()).to.be.properAddress;
  });

  it("should register an agent identity", async function () {
    const identityHash = ethers.keccak256(ethers.toUtf8Bytes("agent-42"));
    await identityRegistry.connect(agent).registerIdentity(identityHash);
    expect(await identityRegistry.isRegistered(agent.address)).to.be.true;
  });

  it("should accept a valid ZK proof", async function () {
    const input = {
      skillSource: "12345678",
      auditNonce: "87654321",
      declaredPermissions: "255",
      observedPermissions: "5",
      auditorSecret: "999999",
      agentId: "42",
      timestamp: "1700000000",
    };

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input, WASM_PATH, ZKEY_PATH
    );

    // Convert proof to Solidity calldata format
    const calldata = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);
    const [pA, pB, pC, pubSignals] = JSON.parse(`[${calldata}]`);

    const identityHash = ethers.keccak256(ethers.toUtf8Bytes("agent-42"));

    const tx = await zkSkillVerifier.submitProof(pA, pB, pC, pubSignals, identityHash);
    const receipt = await tx.wait();

    // Check proof was stored
    const skillHash = ethers.toBeHex(pubSignals[0], 32);
    const agentIdHash = ethers.toBeHex(pubSignals[3], 32);
    expect(await zkSkillVerifier.hasValidProof(agentIdHash, skillHash)).to.be.true;

    // Check validation was submitted to registry
    expect(await validationRegistry.hasValidation(identityHash, skillHash)).to.be.true;
  });

  it("should reject an invalid proof", async function () {
    // Create a valid proof first, then tamper with it
    const input = {
      skillSource: "11111",
      auditNonce: "22222",
      declaredPermissions: "6",
      observedPermissions: "6",
      auditorSecret: "333333",
      agentId: "7",
      timestamp: "1700000001",
    };

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input, WASM_PATH, ZKEY_PATH
    );

    const calldata = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);
    const [pA, pB, pC, pubSignals] = JSON.parse(`[${calldata}]`);

    // Tamper with a public signal (change skillHash)
    pubSignals[0] = "0x" + "1".repeat(64);

    const identityHash = ethers.keccak256(ethers.toUtf8Bytes("agent-7"));

    const result = await zkSkillVerifier.submitProof.staticCall(pA, pB, pC, pubSignals, identityHash);
    expect(result).to.be.false;
  });

  it("should not allow unauthorized validators", async function () {
    const identityHash = ethers.keccak256(ethers.toUtf8Bytes("rogue"));
    const skillHash = ethers.keccak256(ethers.toUtf8Bytes("fake-skill"));
    const validatorId = ethers.keccak256(ethers.toUtf8Bytes("fake-validator"));

    await expect(
      validationRegistry.connect(agent).submitValidation(
        identityHash, skillHash, validatorId, true, "0x"
      )
    ).to.be.revertedWith("Not authorized");
  });
});
