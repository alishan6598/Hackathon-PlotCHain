// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

/// @dev Auth source of truth. Both PlotNFT and PlotMarketplace call in here
///      before executing any privileged function. Never inline role checks.
contract RoleManager {
    address public immutable admin;
    mapping(address => bool) private _dealers;

    error NotAdmin();
    error NotDealer();
    error AlreadyDealer();
    error NotADealer();

    event DealerAdded(address indexed dealer);
    event DealerRemoved(address indexed dealer);

    constructor(address _admin) {
        require(_admin != address(0), "Zero admin");
        admin = _admin;
    }

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    function addDealer(address dealer) external onlyAdmin {
        if (_dealers[dealer]) revert AlreadyDealer();
        _dealers[dealer] = true;
        emit DealerAdded(dealer);
    }

    function removeDealer(address dealer) external onlyAdmin {
        if (!_dealers[dealer]) revert NotADealer();
        _dealers[dealer] = false;
        emit DealerRemoved(dealer);
    }

    function isDealer(address account) external view returns (bool) {
        return _dealers[account];
    }

    function isAdmin(address account) external view returns (bool) {
        return account == admin;
    }
}
