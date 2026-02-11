// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./interfaces/IERC8004.sol";

interface IGroth16Verifier {
    function verifyProof(
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC,
        uint[6] calldata _pubSignals
    ) external view returns (bool);
}

contract ZKSkillVerifier {
    IGroth16Verifier public immutable groth16Verifier;
    IValidationRegistry public immutable validationRegistry;

    struct ProofRecord {
        bytes32 skillHash;
        bytes32 permissionHash;
        bytes32 auditorCommitment;
        bytes32 agentIdHash;
        uint256 timestamp;
        uint256 submittedAt;
        bool verified;
    }

    // agentIdHash => skillHash => ProofRecord
    mapping(bytes32 => mapping(bytes32 => ProofRecord)) public proofRecords;

    // validator ID for ZK proofs in the validation registry
    bytes32 public constant ZK_VALIDATOR_ID = keccak256("skillproof-zk-skill-verifier-v1");

    event ProofVerified(
        bytes32 indexed agentIdHash,
        bytes32 indexed skillHash,
        bytes32 auditorCommitment,
        uint256 timestamp
    );

    event ProofRejected(bytes32 indexed agentIdHash, bytes32 indexed skillHash, string reason);

    constructor(address _groth16Verifier, address _validationRegistry) {
        groth16Verifier = IGroth16Verifier(_groth16Verifier);
        validationRegistry = IValidationRegistry(_validationRegistry);
    }

    function submitProof(
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC,
        uint[6] calldata _pubSignals,
        bytes32 identityHash
    ) external returns (bool) {
        // Public signals layout from circuit:
        // [0] = skillHash
        // [1] = permissionHash
        // [2] = auditorCommitment
        // [3] = agentIdHash
        // [4] = timestampOut
        // [5] = timestamp (public input)

        bool valid = groth16Verifier.verifyProof(_pA, _pB, _pC, _pubSignals);

        bytes32 skillHash = bytes32(_pubSignals[0]);
        bytes32 agentIdHash = bytes32(_pubSignals[3]);

        if (!valid) {
            emit ProofRejected(agentIdHash, skillHash, "Invalid ZK proof");
            return false;
        }

        // Verify timestamp consistency
        require(_pubSignals[4] == _pubSignals[5], "Timestamp mismatch");

        // Store proof record
        proofRecords[agentIdHash][skillHash] = ProofRecord({
            skillHash: skillHash,
            permissionHash: bytes32(_pubSignals[1]),
            auditorCommitment: bytes32(_pubSignals[2]),
            agentIdHash: agentIdHash,
            timestamp: _pubSignals[4],
            submittedAt: block.timestamp,
            verified: true
        });

        // Submit validation to ERC-8004 ValidationRegistry
        validationRegistry.submitValidation(
            identityHash,
            skillHash,
            ZK_VALIDATOR_ID,
            true,
            abi.encode(_pubSignals)
        );

        emit ProofVerified(agentIdHash, skillHash, bytes32(_pubSignals[2]), _pubSignals[4]);
        return true;
    }

    function hasValidProof(bytes32 agentIdHash, bytes32 skillHash) external view returns (bool) {
        return proofRecords[agentIdHash][skillHash].verified;
    }

    function getProofRecord(
        bytes32 agentIdHash,
        bytes32 skillHash
    ) external view returns (ProofRecord memory) {
        return proofRecords[agentIdHash][skillHash];
    }
}
