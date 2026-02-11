// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./interfaces/IERC8004.sol";

contract IdentityRegistry is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    IIdentityRegistry
{
    mapping(address => Identity) private _identities;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() external initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
    }

    function registerIdentity(bytes32 identityHash) external {
        require(!_identities[msg.sender].active, "Already registered");
        _identities[msg.sender] = Identity({
            owner: msg.sender,
            identityHash: identityHash,
            registeredAt: block.timestamp,
            active: true
        });
        emit IdentityRegistered(msg.sender, identityHash);
    }

    function deactivateIdentity() external {
        require(_identities[msg.sender].active, "Not registered");
        _identities[msg.sender].active = false;
        emit IdentityDeactivated(msg.sender, _identities[msg.sender].identityHash);
    }

    function getIdentity(address owner) external view returns (Identity memory) {
        return _identities[owner];
    }

    function isRegistered(address owner) external view returns (bool) {
        return _identities[owner].active;
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}
}
