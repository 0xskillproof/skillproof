// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IIdentityRegistry {
    struct Identity {
        address owner;
        bytes32 identityHash;
        uint256 registeredAt;
        bool active;
    }

    event IdentityRegistered(address indexed owner, bytes32 indexed identityHash);
    event IdentityDeactivated(address indexed owner, bytes32 indexed identityHash);

    function registerIdentity(bytes32 identityHash) external;
    function deactivateIdentity() external;
    function getIdentity(address owner) external view returns (Identity memory);
    function isRegistered(address owner) external view returns (bool);
}

interface IReputationRegistry {
    struct ReputationRecord {
        bytes32 identityHash;
        uint256 score;
        uint256 totalValidations;
        uint256 lastUpdated;
    }

    event ReputationUpdated(bytes32 indexed identityHash, uint256 newScore, uint256 totalValidations);

    function updateReputation(bytes32 identityHash, uint256 scoreDelta) external;
    function getReputation(bytes32 identityHash) external view returns (ReputationRecord memory);
}

interface IValidationRegistry {
    struct ValidationRecord {
        bytes32 identityHash;
        bytes32 skillHash;
        bytes32 validatorId;
        uint256 timestamp;
        bool valid;
        bytes data;
    }

    event ValidationSubmitted(
        bytes32 indexed identityHash,
        bytes32 indexed skillHash,
        bytes32 indexed validatorId,
        bool valid
    );

    function submitValidation(
        bytes32 identityHash,
        bytes32 skillHash,
        bytes32 validatorId,
        bool valid,
        bytes calldata data
    ) external;

    function getValidation(bytes32 identityHash, bytes32 skillHash) external view returns (ValidationRecord memory);
    function hasValidation(bytes32 identityHash, bytes32 skillHash) external view returns (bool);
}
