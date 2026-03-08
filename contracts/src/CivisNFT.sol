// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "solady/tokens/ERC721.sol";
import {OwnableRoles} from "solady/auth/OwnableRoles.sol";
import {LibString} from "solady/utils/LibString.sol";

/// @title Civis Proof NFT
/// @notice ERC-5484 soulbound NFT representing verified real-world contributions on Creditcoin.
/// @dev Each token corresponds to a single verified action (donation, volunteering, etc.).
///      Tokens are soulbound: they cannot be transferred after minting.
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

/// @title CivisNFT
/// @notice Soulbound ERC-721 NFT (ERC-5484) awarded for verified real-world actions within the Civis protocol.
/// @dev Inherits Solady ERC721 and OwnableRoles. Tokens cannot be transferred between non-zero addresses.
contract CivisNFT is ERC721, OwnableRoles, IERC5484 {

    string public baseTokenURI;
    uint256 public constant MINTER_ROLE = _ROLE_0;

    // --- Storage Hitchhiking: BurnAuth stored in ERC721 _extraData (uint96) ---
    uint256 private constant _BURN_AUTH_MASK = 0x3;

    /// @notice Maps tokenId to the action value string (e.g. donation amount, hours volunteered).
    mapping(uint256 => string) public actionValues;

    event BaseTokenURIChanged(string oldBaseURI, string newBaseURI);

    error Soulbound();

    /// @param initialOwner Address that will be set as owner and receive admin roles.
    /// @param initialBaseTokenURI Base URI prepended to the action value in tokenURI().
    constructor(address initialOwner, string memory initialBaseTokenURI) {
        if (initialOwner == address(0)) revert("CivisNFT: Initial owner cannot be zero address");
        _initializeOwner(initialOwner);
        _setBaseTokenURI(initialBaseTokenURI);
    }

    function name() public view virtual override returns (string memory) {
        return "Civis Proof";
    }

    function symbol() public view virtual override returns (string memory) {
        return "CPF";
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal virtual override {
        super._beforeTokenTransfer(from, to, tokenId);
        if (from != address(0) && to != address(0)) {
            revert Soulbound();
        }
    }

    function approve(address, uint256) public payable virtual override {
        revert Soulbound();
    }

    function setApprovalForAll(address, bool) public virtual override {
        revert Soulbound();
    }

    /// @notice Mints a soulbound Civis Proof NFT to the specified address.
    /// @dev Caller must have MINTER_ROLE. The actionValue is stored and used in tokenURI.
    /// @param to Recipient of the minted token.
    /// @param tokenId Unique token identifier.
    /// @param _burnAuth The burn authorisation rule for this token.
    /// @param _actionValue Arbitrary string describing the verified action (e.g. donation amount).
    function mint(address to, uint256 tokenId, BurnAuth _burnAuth, string memory _actionValue) public virtual {
        _checkRoles(MINTER_ROLE);
        if (to == address(0)) revert TransferToZeroAddress();
        if (_exists(tokenId)) revert TokenAlreadyExists();
        _mintAndSetExtraDataUnchecked(to, tokenId, uint96(_burnAuth));
        actionValues[tokenId] = _actionValue;
        emit Issued(msg.sender, to, tokenId, _burnAuth);
    }

    function burn(uint256 tokenId) public virtual {
        if (!_exists(tokenId)) revert("TOKEN_NOT_FOUND");
        BurnAuth _auth = burnAuth(tokenId);
        address tokenOwner_ = _ownerOf(tokenId);
        bool isTokenActualOwner = (msg.sender == tokenOwner_);
        bool isMinter = hasAllRoles(msg.sender, MINTER_ROLE);
        bool authorizedToBurn = false;
        if (_auth == BurnAuth.IssuerOnly) { if (isMinter) authorizedToBurn = true; }
        else if (_auth == BurnAuth.OwnerOnly) { if (isTokenActualOwner) authorizedToBurn = true; }
        else if (_auth == BurnAuth.Both) { if (isTokenActualOwner || isMinter) authorizedToBurn = true; }
        else if (_auth == BurnAuth.Neither) { revert("BURN_NOT_ALLOWED"); }
        if (!authorizedToBurn) revert("NOT_AUTHORIZED_BURN");
        _burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        if (!_exists(tokenId)) revert TokenDoesNotExist();
        return string(abi.encodePacked(baseTokenURI, actionValues[tokenId]));
    }

    function burnAuth(uint256 tokenId) public view virtual override returns (BurnAuth) {
        if (!_exists(tokenId)) revert TokenDoesNotExist();
        uint96 extraData = _getExtraData(tokenId);
        uint8 authBits = uint8(extraData & _BURN_AUTH_MASK);
        return BurnAuth(authBits);
    }

    function setBaseTokenURI(string memory _newBaseTokenURI) public virtual onlyOwner {
        _setBaseTokenURI(_newBaseTokenURI);
    }

    function _setBaseTokenURI(string memory _newBaseTokenURI) internal {
        string memory oldBaseURI = baseTokenURI;
        baseTokenURI = _newBaseTokenURI;
        emit BaseTokenURIChanged(oldBaseURI, _newBaseTokenURI);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        if (interfaceId == type(IERC5484).interfaceId) return true;
        return super.supportsInterface(interfaceId);
    }
}
