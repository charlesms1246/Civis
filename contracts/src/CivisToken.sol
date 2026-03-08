// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "solady/tokens/ERC20.sol";
import {OwnableRoles} from "solady/auth/OwnableRoles.sol";

/// @title CivisToken
/// @notice Non-transferable (soulbound) ERC-20 token awarded for verified real-world contributions.
/// @dev CIVIS tokens are minted by the CivisProofVerifier and can only be redeemed (burned) by the holder.
///      Transfer between non-zero addresses is blocked to preserve the soulbound property.
contract CivisToken is ERC20, OwnableRoles {

    uint256 public constant MINTER_ROLE = _ROLE_0;

    error Soulbound();

    event Redeemed(address indexed user, uint256 amount);

    constructor(address initialOwner) {
        _initializeOwner(initialOwner);
    }

    function name() public view virtual override returns (string memory) {
        return "Civis";
    }

    function symbol() public view virtual override returns (string memory) {
        return "CIVIS";
    }

    /// @notice Mints CIVIS tokens to the specified address.
    /// @dev Caller must have MINTER_ROLE.
    function mint(address to, uint256 amount) external {
        _checkRoles(MINTER_ROLE);
        _mint(to, amount);
    }

    /// @notice Burns CIVIS tokens from the caller, emitting a Redeemed event.
    function redeem(uint256 amount) external {
        _burn(msg.sender, amount);
        emit Redeemed(msg.sender, amount);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal override {
        if (from != address(0) && to != address(0)) {
            revert Soulbound();
        }
    }
}
