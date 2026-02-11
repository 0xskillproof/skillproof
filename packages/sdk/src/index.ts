export { SkillProofClient, type SkillProofClientConfig } from "./client";
export { pulsechain, pulsechainTestnetV4, type SkillProofAddresses } from "./chain";
export { computeIdentityHash, registerAgent, isAgentRegistered, getAgentIdentity } from "./identity";
export { generateProof, verifyProofOffchain, type SkillAuditInput, type SkillAuditProof } from "./proof";
export { submitProofOnchain, hasValidProof, getProofRecord, hasValidation } from "./verification";
export { IdentityRegistryABI, ValidationRegistryABI, ZKSkillVerifierABI } from "./abi";
