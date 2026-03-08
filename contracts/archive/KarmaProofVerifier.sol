// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.21;

import {EmailDomainProver} from "./EmailDomainProver.sol";

import {Proof} from "vlayer-0.1.0/Proof.sol";
import {Verifier} from "vlayer-0.1.0/Verifier.sol";
import {KarmaNFT, IERC5484} from "./KarmaNFT.sol";
import {KarmaToken} from "./KarmaToken.sol";

contract KarmaProofVerifier is Verifier {
    address public prover;
    address public karmaNFT;
    address public karmaToken;

    constructor(address _prover, address _karmaNFT, address _karmaToken) {
        prover = _prover;
        karmaNFT = _karmaNFT;
        karmaToken = _karmaToken;
    }

    function verify(Proof calldata, bytes32 _karmaHash, string memory _donationAmount)
        public
        onlyVerified(prover, EmailDomainProver.main.selector)
    {
        uint256 tokenId = uint256(keccak256(abi.encodePacked(_karmaHash, blockhash(block.number - 1)))); // only used so we can demo with the same email repeatedly
        KarmaNFT(karmaNFT).mint(msg.sender, tokenId, IERC5484.BurnAuth.OwnerOnly, _donationAmount);
        KarmaToken(karmaToken).mint(msg.sender, 20e18); // TODO: make this dynamic based on donation amount
    }

    function verifySkip(Proof calldata, bytes32 _karmaHash, string memory _donationAmount)
        public
    {
        // require(block.chainid == 545, "Only supported on Flow chain");
        // used for Flow chain as vLayer currently does not support it
        uint256 tokenId = uint256(keccak256(abi.encodePacked(_karmaHash, blockhash(block.number - 1)))); // only used so we can demo with the same email repeatedly
        KarmaNFT(karmaNFT).mint(msg.sender, tokenId, IERC5484.BurnAuth.OwnerOnly, _donationAmount);
        KarmaToken(karmaToken).mint(msg.sender, 20e18);
    }
}
