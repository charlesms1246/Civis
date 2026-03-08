// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.21;

import {Strings} from "@openzeppelin-contracts-5.0.1/utils/Strings.sol";
import {Proof} from "vlayer-0.1.0/Proof.sol";
import {Prover} from "vlayer-0.1.0/Prover.sol";
import {RegexLib} from "vlayer-0.1.0/Regex.sol";
import {VerifiedEmail, UnverifiedEmail, EmailProofLib} from "vlayer-0.1.0/EmailProof.sol";
import {console} from "forge-std/console.sol";

contract EmailDomainProver is Prover {
    using RegexLib for string;
    using Strings for string;
    using EmailProofLib for UnverifiedEmail;

    string public constant VALID_EMAIL_DOMAIN = "wikimedia.org";

    function main(UnverifiedEmail calldata unverifiedEmail)
        public
        view
        returns (Proof memory, bytes32, string memory)
    {
        console.log("unverifiedEmail.from", unverifiedEmail.dnsRecord.name);
        VerifiedEmail memory email = unverifiedEmail.verify();
        console.log("Email verified");
        
        // Verify email is from wikimedia.org domain
        string[] memory captures = email.from.capture("^[^@]+@([^@]+)$");
        console.log("email.from", email.from);
        console.log("captures", captures[1]);
        require(captures.length == 2, "invalid email domain");
        require(keccak256(bytes(captures[1])) == keccak256(bytes(VALID_EMAIL_DOMAIN)), "invalid email domain");

        // Extract donation amount from email body independently of the currency
        string[] memory amount = email.body.capture("^[\\s\\S]*\\b[A-Z]{3}\\s+\\D?(\\d+\\.\\d{2})[\\s\\S]*$");
        console.log("amount", amount[1]);

        return (proof(), sha256(abi.encodePacked(email.from)), amount[1]);
    }
}
