// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./interfaces/IERC8004.sol";

contract ReputationRegistry is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    IReputationRegistry
{
    mapping(bytes32 => ReputationRecord) private _reputations;
    mapping(address => bool) public authorizedUpdaters;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() external initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
    }

    function setAuthorizedUpdater(address updater, bool authorized) external onlyOwner {
        authorizedUpdaters[updater] = authorized;
    }

    function updateReputation(bytes32 identityHash, uint256 scoreDelta) external {
        require(authorizedUpdaters[msg.sender] || msg.sender == owner(), "Not authorized");
        ReputationRecord storage rep = _reputations[identityHash];
        rep.identityHash = identityHash;
        rep.score += scoreDelta;
        rep.totalValidations += 1;
        rep.lastUpdated = block.timestamp;
        emit ReputationUpdated(identityHash, rep.score, rep.totalValidations);
    }

    function getReputation(bytes32 identityHash) external view returns (ReputationRecord memory) {
        return _reputations[identityHash];
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}
}
