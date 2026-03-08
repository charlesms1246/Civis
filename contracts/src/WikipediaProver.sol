// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.21;

/// @title WikipediaProver
/// @notice vlayer off-chain Prover for Wikipedia/Wikimedia donation confirmation emails.
/// @dev Executed by the vlayer prover SDK; NOT deployed to Creditcoin. The compiled artifact
///      is consumed by the Next.js frontend via @vlayer/sdk to generate ZK email proofs.

import {Strings} from "@openzeppelin-contracts-5.0.1/utils/Strings.sol";
import {Proof} from "vlayer-0.1.0/Proof.sol";
import {Prover} from "vlayer-0.1.0/Prover.sol";
import {RegexLib} from "vlayer-0.1.0/Regex.sol";
import {VerifiedEmail, UnverifiedEmail, EmailProofLib} from "vlayer-0.1.0/EmailProof.sol";
import {console} from "forge-std/console.sol";

contract WikipediaProver is Prover {
    using RegexLib for string;
    using Strings for string;
    using EmailProofLib for UnverifiedEmail;

    /// @notice The valid sender domain for Wikipedia/Wikimedia donation emails.
    string public constant VALID_EMAIL_DOMAIN = "wikimedia.org";

    /// @notice Civis action category — 0 = Donation.
    uint8 public constant CATEGORY_ID = 0;

    /// @notice Proves that an email is a genuine Wikimedia donation confirmation.
    /// @param unverifiedEmail The raw email supplied by the user, ready for DKIM verification.
    /// @return proof        vlayer Proof struct (populated by the prover runtime).
    /// @return emailHash    sha256 of the verified sender address; used as the on-chain actionHash.
    /// @return actionValue  Extracted donation amount string (e.g. "25.00").
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

        // Extract donation amount — expects 3-letter ISO currency code followed by a decimal amount
        string[] memory amount = email.body.capture("^[\\s\\S]*\\b[A-Z]{3}\\s+\\D?(\\d+\\.\\d{2})[\\s\\S]*$");
        console.log("amount", amount[1]);

        return (proof(), sha256(abi.encodePacked(email.from)), amount[1]);
    }
}
