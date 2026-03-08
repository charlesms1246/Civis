// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {CivisNFT, IERC5484} from "./CivisNFT.sol";
import {CivisToken} from "./CivisToken.sol";
import {Ownable} from "@openzeppelin-contracts-5.0.1/access/Ownable.sol";

/// @title CivisProofVerifier
/// @notice On-chain verifier that awards a CivisNFT and CIVIS tokens for each verified real-world action.
/// @dev Does NOT inherit from vlayer's Verifier. Proof validation is handled off-chain (or by a trusted
///      relayer); this contract only enforces replay protection via actionHash and manages minting.
contract CivisProofVerifier is Ownable {

    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------

    /// @notice Address of the deployed CivisNFT contract.
    address public civisNFT;

    /// @notice Address of the deployed CivisToken contract.
    address public civisToken;

    /// @notice Tracks action hashes that have already been claimed to prevent replay attacks.
    mapping(bytes32 => bool) public usedHashes;

    /// @notice Amount of CIVIS tokens (with 18 decimals) awarded per verified action.
    uint256 public rewardAmount;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    /// @notice Emitted when a user successfully claims a verified action.
    /// @param user       Address of the claimant.
    /// @param actionHash Unique hash representing the verified real-world action.
    /// @param categoryId Numeric category identifier (0 = Donation, 1 = Volunteering, …).
    /// @param tokenId    ID of the CivisNFT minted to the user.
    event ActionVerified(
        address indexed user,
        bytes32 indexed actionHash,
        uint8 categoryId,
        uint256 tokenId
    );

    // -------------------------------------------------------------------------
    // Errors
    // -------------------------------------------------------------------------

    /// @notice Thrown when an action hash has already been claimed.
    error AlreadyClaimed();

    /// @notice Thrown when a required address parameter is the zero address.
    error ZeroAddress();

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    /// @param _civisNFT   Address of the deployed CivisNFT contract. Must be non-zero.
    /// @param _civisToken Address of the deployed CivisToken contract. Must be non-zero.
    constructor(address _civisNFT, address _civisToken) Ownable(msg.sender) {
        if (_civisNFT == address(0)) revert ZeroAddress();
        if (_civisToken == address(0)) revert ZeroAddress();
        civisNFT = _civisNFT;
        civisToken = _civisToken;
        rewardAmount = 20e18;
    }

    // -------------------------------------------------------------------------
    // Core
    // -------------------------------------------------------------------------

    /// @notice Claims a verified real-world action: mints a soulbound NFT and awards CIVIS tokens.
    /// @dev Replay-protected by `usedHashes`. The caller is the action recipient.
    /// @param _actionHash   Unique bytes32 hash identifying this specific verified action.
    /// @param _actionValue  String describing the action (e.g. donation amount, hours served).
    /// @param _categoryId   Category of the action (Donation=0, Volunteering=1, Environmental=2,
    ///                      Education=3, Healthcare=4, Community=5).
    function verify(bytes32 _actionHash, string memory _actionValue, uint8 _categoryId) external {
        if (usedHashes[_actionHash]) revert AlreadyClaimed();
        usedHashes[_actionHash] = true;

        uint256 tokenId = uint256(keccak256(abi.encodePacked(_actionHash, blockhash(block.number - 1))));

        CivisNFT(civisNFT).mint(msg.sender, tokenId, IERC5484.BurnAuth.OwnerOnly, _actionValue);
        CivisToken(civisToken).mint(msg.sender, rewardAmount);

        emit ActionVerified(msg.sender, _actionHash, _categoryId, tokenId);
    }

    // -------------------------------------------------------------------------
    // Admin
    // -------------------------------------------------------------------------

    /// @notice Updates the CIVIS token reward amount per verified action.
    /// @dev Owner-only. New amount applies to all subsequent `verify` calls.
    /// @param _newAmount New reward in CIVIS tokens (with 18 decimals), e.g. 20e18.
    function setRewardAmount(uint256 _newAmount) external onlyOwner {
        rewardAmount = _newAmount;
    }
}
