const { ethers, upgrades } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  // 1. Deploy ERC-8004 Registries (UUPS proxies)
  console.log("\n--- Deploying ERC-8004 Registries ---");

  const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
  const identityRegistry = await upgrades.deployProxy(IdentityRegistry, [], {
    kind: "uups",
  });
  await identityRegistry.waitForDeployment();
  const identityAddr = await identityRegistry.getAddress();
  console.log("IdentityRegistry:", identityAddr);

  const ReputationRegistry = await ethers.getContractFactory("ReputationRegistry");
  const reputationRegistry = await upgrades.deployProxy(ReputationRegistry, [], {
    kind: "uups",
  });
  await reputationRegistry.waitForDeployment();
  const reputationAddr = await reputationRegistry.getAddress();
  console.log("ReputationRegistry:", reputationAddr);

  const ValidationRegistry = await ethers.getContractFactory("ValidationRegistry");
  const validationRegistry = await upgrades.deployProxy(ValidationRegistry, [], {
    kind: "uups",
  });
  await validationRegistry.waitForDeployment();
  const validationAddr = await validationRegistry.getAddress();
  console.log("ValidationRegistry:", validationAddr);

  // 2. Deploy Groth16 Verifier (auto-generated)
  console.log("\n--- Deploying Groth16 Verifier ---");
  const Groth16Verifier = await ethers.getContractFactory("Groth16Verifier");
  const groth16Verifier = await Groth16Verifier.deploy();
  await groth16Verifier.waitForDeployment();
  const groth16Addr = await groth16Verifier.getAddress();
  console.log("Groth16Verifier:", groth16Addr);

  // 3. Deploy ZKSkillVerifier
  console.log("\n--- Deploying ZKSkillVerifier ---");
  const ZKSkillVerifier = await ethers.getContractFactory("ZKSkillVerifier");
  const zkSkillVerifier = await ZKSkillVerifier.deploy(groth16Addr, validationAddr);
  await zkSkillVerifier.waitForDeployment();
  const zkSkillAddr = await zkSkillVerifier.getAddress();
  console.log("ZKSkillVerifier:", zkSkillAddr);

  // 4. Authorize ZKSkillVerifier as a validator
  console.log("\n--- Configuring permissions ---");
  await validationRegistry.setAuthorizedValidator(zkSkillAddr, true);
  console.log("ZKSkillVerifier authorized as validator");

  // Authorize ZKSkillVerifier as reputation updater
  await reputationRegistry.setAuthorizedUpdater(zkSkillAddr, true);
  console.log("ZKSkillVerifier authorized as reputation updater");

  console.log("\n=== Deployment Complete ===");
  console.log({
    identityRegistry: identityAddr,
    reputationRegistry: reputationAddr,
    validationRegistry: validationAddr,
    groth16Verifier: groth16Addr,
    zkSkillVerifier: zkSkillAddr,
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
