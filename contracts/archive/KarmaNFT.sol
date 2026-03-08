// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "solady/tokens/ERC721.sol";
import {OwnableRoles} from "solady/auth/OwnableRoles.sol";
import {LibString} from "solady/utils/LibString.sol";

/// @dev Interface for ERC-5484 Consensual Soulbound Tokens
// see: https://eips.ethereum.org/EIPS/eip-5484
interface IERC5484 {
    enum BurnAuth {
        IssuerOnly, // 0
        OwnerOnly,  // 1
        Both,       // 2
        Neither     // 3
    }

    event Issued(
        address indexed from, // Issuer
        address indexed to,   // Receiver
        uint256 indexed tokenId,
        BurnAuth burnAuth
    );

    function burnAuth(uint256 tokenId) external view returns (BurnAuth);
}

contract KarmaNFT is ERC721, OwnableRoles, IERC5484 {

    string public baseTokenURI;
    uint256 public constant MINTER_ROLE = _ROLE_0;

    // --- Storage Hitchhiking: BurnAuth stored in ERC721 _extraData (uint96) --- 
    // We use the lower 2 bits of the 96 available extraData bits for BurnAuth.
    uint256 private constant _BURN_AUTH_MASK = 0x3; // Binary 11, to isolate 2 bits for BurnAuth enum
    
    mapping(uint256 => string) public karmaAmounts; // TODO store as uint in extraData as well

    event BaseTokenURIChanged(string oldBaseURI, string newBaseURI);
    
    error Soulbound();

    constructor(address initialOwner, string memory initialBaseTokenURI)
    {
        if (initialOwner == address(0)) revert("KarmaNFT: Initial owner cannot be zero address");
        _initializeOwner(initialOwner);
        _setBaseTokenURI(initialBaseTokenURI);
    }

    function name() public view virtual override returns (string memory) {
        return "Verified Karma Proof";
    }

    function symbol() public view virtual override returns (string memory) {
        return "VKP";
    }

    // ---- ERC721 soulbound overrides ----
    /**
     * @dev See {IERC721-_beforeTokenTransfer}.
     * Overridden to enforce soulbound nature:
     * - Allows minting (from == address(0)).
     * - Allows burning (to == address(0)).
     * - Disallows other transfers (from != address(0) && to != address(0)).
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, tokenId); // Handles ERC721 standard checks

        if (from != address(0) && to != address(0)) {
            revert Soulbound();
        }
    }

    /**
     * @dev See {IERC721-approve}.
     * Disabled for soulbound tokens.
     */
    function approve(address, uint256) public payable virtual override {
        revert Soulbound();
    }

    /**
     * @dev See {IERC721-setApprovalForAll}.
     * Disabled for soulbound tokens.
     */
    function setApprovalForAll(address, bool) public virtual override {
        revert Soulbound();
    }

    // Note: getApproved(tokenId) will consistently return address(0).
    // Note: isApprovedForAll(owner, operator) will consistently return false.

    // ---- Minting ----
    /**
     * @dev Mints a new Karma NFT.
     * Can only be called by the `minterAddress`.
     * The `tokenURI_` is set for the `tokenId`.
     */
    function mint(address to, uint256 tokenId, BurnAuth _burnAuth, string memory _karmaAmount) public virtual {
        _checkRoles(MINTER_ROLE); // Throws if msg.sender doesn't have MINTER_ROLE
        
        if (to == address(0)) {
            revert TransferToZeroAddress();
        }
        if (_exists(tokenId)) {
            revert TokenAlreadyExists();
        }

        _mintAndSetExtraDataUnchecked(to, tokenId, uint96(_burnAuth));
        karmaAmounts[tokenId] = _karmaAmount;
        emit Issued(msg.sender, to, tokenId, _burnAuth); // msg.sender is the issuer (minter)
    }

    // ---- Burning ----
    /**
     * @dev Burns a Karma NFT.
     * Can be called by:
     *  - The owner of the `tokenId`.
     *  - The contract `owner()`.
     *  - The `minterAddress`.
     */
    function burn(uint256 tokenId) public virtual {
        if (!_exists(tokenId)) {
            revert("TOKEN_NOT_FOUND");
        }

        BurnAuth _auth = burnAuth(tokenId);
        address tokenOwner_ = _ownerOf(tokenId);
        bool isTokenActualOwner = (msg.sender == tokenOwner_);
        bool isMinter = hasAllRoles(msg.sender, MINTER_ROLE);

        bool authorizedToBurn = false;
        if (_auth == BurnAuth.IssuerOnly) {
            if (isMinter) authorizedToBurn = true;
        } else if (_auth == BurnAuth.OwnerOnly) {
            if (isTokenActualOwner) authorizedToBurn = true;
        } else if (_auth == BurnAuth.Both) {
            if (isTokenActualOwner || isMinter) authorizedToBurn = true;
        } else if (_auth == BurnAuth.Neither) {
            revert("BURN_NOT_ALLOWED");
        }

        if (!authorizedToBurn) {
            revert("NOT_AUTHORIZED_BURN");
        }

        _burn(tokenId); // also clears extraData
    }

    // ---- Token URI Logic ----
    /**
     * @dev Internal function to set the token URI for a given token ID.
     */
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        if (!_exists(tokenId)) {
            revert TokenDoesNotExist();
        }
        return string(abi.encodePacked(baseTokenURI, karmaAmounts[tokenId]));
    }

    // ---- ERC5484-required view function ----
    function burnAuth(uint256 tokenId) public view virtual override returns (BurnAuth) {
        if (!_exists(tokenId)) {
            revert TokenDoesNotExist();
        }
        uint96 extraData = _getExtraData(tokenId);
        uint8 authBits = uint8(extraData & _BURN_AUTH_MASK); // Extract lower 2 bits
        return BurnAuth(authBits);
    }

    // ---- Admin Functions ----
    /**
     * @dev Allows the contract owner to change the `baseTokenURI`.
     */
    function setBaseTokenURI(string memory _newBaseTokenURI) public virtual onlyOwner {
        _setBaseTokenURI(_newBaseTokenURI);
    }

    function _setBaseTokenURI(string memory _newBaseTokenURI) internal {
        string memory oldBaseURI = baseTokenURI;
        baseTokenURI = _newBaseTokenURI;
        emit BaseTokenURIChanged(oldBaseURI, _newBaseTokenURI);
    }
    
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        if (interfaceId == type(IERC5484).interfaceId) {
            return true;
        }
        return super.supportsInterface(interfaceId);
    }
} 