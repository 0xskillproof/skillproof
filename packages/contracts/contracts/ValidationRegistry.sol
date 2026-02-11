// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./interfaces/IERC8004.sol";

contract ValidationRegistry is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    IValidationRegistry
{
    mapping(bytes32 => mapping(bytes32 => ValidationRecord)) private _validations;
    mapping(address => bool) public authorizedValidators;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() external initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
    }

    function setAuthorizedValidator(address validator, bool authorized) external onlyOwner {
        authorizedValidators[validator] = authorized;
    }

    function submitValidation(
        bytes32 identityHash,
        bytes32 skillHash,
        bytes32 validatorId,
        bool valid,
        bytes calldata data
    ) external {
        require(authorizedValidators[msg.sender] || msg.sender == owner(), "Not authorized");
        _validations[identityHash][skillHash] = ValidationRecord({
            identityHash: identityHash,
            skillHash: skillHash,
            validatorId: validatorId,
            timestamp: block.timestamp,
            valid: valid,
            data: data
        });
        emit ValidationSubmitted(identityHash, skillHash, validatorId, valid);
    }

    function getValidation(
        bytes32 identityHash,
        bytes32 skillHash
    ) external view returns (ValidationRecord memory) {
        return _validations[identityHash][skillHash];
    }

    function hasValidation(bytes32 identityHash, bytes32 skillHash) external view returns (bool) {
        return _validations[identityHash][skillHash].valid;
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}
}
