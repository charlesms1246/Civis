// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "solady/tokens/ERC20.sol";
import {OwnableRoles} from "solady/auth/OwnableRoles.sol";
import {LibString} from "solady/utils/LibString.sol";

contract KarmaToken is ERC20, OwnableRoles {

    uint256 public constant MINTER_ROLE = _ROLE_0;

    error Soulbound();

    event Redeemed(address indexed user, uint256 amount);

    constructor(address initialOwner) {
        _initializeOwner(initialOwner);
    }

    function name() public view virtual override returns (string memory) {
        return "Verified Karma";
    }

    function symbol() public view virtual override returns (string memory) {
        return "vKarma";
    }

    function mint(address to, uint256 amount) external {
        _checkRoles(MINTER_ROLE); // Throws if msg.sender doesn't have MINTER_ROLE
        _mint(to, amount);
    }

    function redeem(uint256 amount) external {
        _burn(msg.sender, amount);
        emit Redeemed(msg.sender, amount);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal override {
        if (from != address(0) && to != address(0)) {
            // Soulbound token, cannot be transferred but can be minted and burned
            revert Soulbound();
        }
    }
}