export const IdentityRegistryABI = [
  {
    inputs: [{ name: "identityHash", type: "bytes32" }],
    name: "registerIdentity",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "deactivateIdentity",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "isRegistered",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "getIdentity",
    outputs: [
      {
        components: [
          { name: "owner", type: "address" },
          { name: "identityHash", type: "bytes32" },
          { name: "registeredAt", type: "uint256" },
          { name: "active", type: "bool" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const ValidationRegistryABI = [
  {
    inputs: [
      { name: "identityHash", type: "bytes32" },
      { name: "skillHash", type: "bytes32" },
    ],
    name: "hasValidation",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "identityHash", type: "bytes32" },
      { name: "skillHash", type: "bytes32" },
    ],
    name: "getValidation",
    outputs: [
      {
        components: [
          { name: "identityHash", type: "bytes32" },
          { name: "skillHash", type: "bytes32" },
          { name: "validatorId", type: "bytes32" },
          { name: "timestamp", type: "uint256" },
          { name: "valid", type: "bool" },
          { name: "data", type: "bytes" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const ZKSkillVerifierABI = [
  {
    inputs: [
      { name: "_pA", type: "uint256[2]" },
      { name: "_pB", type: "uint256[2][2]" },
      { name: "_pC", type: "uint256[2]" },
      { name: "_pubSignals", type: "uint256[6]" },
      { name: "identityHash", type: "bytes32" },
    ],
    name: "submitProof",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "agentIdHash", type: "bytes32" },
      { name: "skillHash", type: "bytes32" },
    ],
    name: "hasValidProof",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "agentIdHash", type: "bytes32" },
      { name: "skillHash", type: "bytes32" },
    ],
    name: "getProofRecord",
    outputs: [
      {
        components: [
          { name: "skillHash", type: "bytes32" },
          { name: "permissionHash", type: "bytes32" },
          { name: "auditorCommitment", type: "bytes32" },
          { name: "agentIdHash", type: "bytes32" },
          { name: "timestamp", type: "uint256" },
          { name: "submittedAt", type: "uint256" },
          { name: "verified", type: "bool" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;
