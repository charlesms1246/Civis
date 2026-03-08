// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.21;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/CivisNFT.sol";
import "../src/CivisToken.sol";
import "../src/CivisProofVerifier.sol";

contract DeployCivis is Script {

    struct NetworkConfig {
        string networkName;
        string rpcUrl;
        string blockscoutUrl;
    }

    function getNetworkConfig(uint256 chainId) internal pure returns (NetworkConfig memory) {
        if (chainId == 102031) {
            return NetworkConfig({
                networkName: "Creditcoin Testnet",
                rpcUrl: "https://rpc.cc3-testnet.creditcoin.network",
                blockscoutUrl: "https://creditcoin-testnet.blockscout.com"
            });
        } else if (chainId == 31337) {
            return NetworkConfig({
                networkName: "Anvil Local",
                rpcUrl: "http://127.0.0.1:8545",
                blockscoutUrl: "http://localhost:4000"
            });
        } else {
            return NetworkConfig({
                networkName: "Unknown Network",
                rpcUrl: "",
                blockscoutUrl: ""
            });
        }
    }

    function run() external {
        string memory baseUri = vm.envOr(
            "CIVIS_NFT_BASE_URI",
            string("https://civis.example.com/api/nft?categoryId=")
        );

        vm.startBroadcast();
        address deployer = msg.sender;

        console.log("Deploying Civis contracts...");
        console.log("Deployer address:", deployer);
        console.log("Chain ID:", vm.toString(block.chainid));
        console.log("Block number:", block.number);
        console.log("NFT Base URI:", baseUri);
        console.log("");

        // Step 1: Deploy CivisNFT
        CivisNFT civisNFT = new CivisNFT(deployer, baseUri);
        console.log("CivisNFT deployed at:          ", address(civisNFT));

        // Step 2: Deploy CivisToken
        CivisToken civisToken = new CivisToken(deployer);
        console.log("CivisToken deployed at:        ", address(civisToken));

        // Step 3: Deploy CivisProofVerifier
        CivisProofVerifier civisVerifier = new CivisProofVerifier(
            address(civisNFT),
            address(civisToken)
        );
        console.log("CivisProofVerifier deployed at:", address(civisVerifier));

        // Step 4: Grant MINTER_ROLE on CivisNFT to CivisProofVerifier
        console.log("Granting MINTER_ROLE on CivisNFT to CivisProofVerifier...");
        civisNFT.grantRoles(address(civisVerifier), civisNFT.MINTER_ROLE());

        // Step 5: Grant MINTER_ROLE on CivisToken to CivisProofVerifier
        console.log("Granting MINTER_ROLE on CivisToken to CivisProofVerifier...");
        civisToken.grantRoles(address(civisVerifier), civisToken.MINTER_ROLE());

        vm.stopBroadcast();

        // -----------------------------------------------------------------------
        // Post-deployment validation (read-only, no broadcast required)
        // -----------------------------------------------------------------------
        require(
            civisVerifier.civisNFT() == address(civisNFT),
            "CivisVerifier: NFT address mismatch"
        );
        require(
            civisVerifier.civisToken() == address(civisToken),
            "CivisVerifier: Token address mismatch"
        );
        require(
            civisVerifier.owner() == deployer,
            "CivisVerifier: Owner is not deployer"
        );

        // -----------------------------------------------------------------------
        // Console output summary
        // -----------------------------------------------------------------------
        NetworkConfig memory net = getNetworkConfig(block.chainid);

        console.log("");
        console.log("=== CIVIS DEPLOYMENT SUCCESSFUL ===");
        console.log("");
        console.log("Network:", net.networkName, string.concat("(Chain ID: ", vm.toString(block.chainid), ")"));
        console.log("");
        console.log("Contract Addresses:");
        console.log("CivisNFT:            ", address(civisNFT));
        console.log("CivisToken:          ", address(civisToken));
        console.log("CivisProofVerifier:  ", address(civisVerifier));
        console.log("");
        console.log("Roles Verified:");
        console.log("CivisNFT MINTER_ROLE -> CivisProofVerifier: OK");
        console.log("CivisToken MINTER_ROLE -> CivisProofVerifier: OK");
        console.log("");
        console.log("Add these to your app/.env.local file:");
        console.log(string.concat("NEXT_PUBLIC_CHAIN_ID=", vm.toString(block.chainid)));
        console.log(string.concat("NEXT_PUBLIC_RPC_URL=", net.rpcUrl));
        console.log(string.concat("NEXT_PUBLIC_BLOCKSCOUT_URL=", net.blockscoutUrl));
        console.log(string.concat("NEXT_PUBLIC_CIVIS_NFT_CONTRACT=", vm.toString(address(civisNFT))));
        console.log(string.concat("NEXT_PUBLIC_CIVIS_TOKEN_CONTRACT=", vm.toString(address(civisToken))));
        console.log(string.concat("NEXT_PUBLIC_CIVIS_VERIFIER_CONTRACT=", vm.toString(address(civisVerifier))));

        // -----------------------------------------------------------------------
        // Write machine-readable JSON to deployments/
        // -----------------------------------------------------------------------
        vm.createDir("./deployments/", true);

        string memory outputFile;
        if (block.chainid == 31337) {
            outputFile = "./deployments/anvil-local.json";
        } else {
            outputFile = "./deployments/creditcoin-testnet.json";
        }

        string memory json = string.concat(
            "{\n",
            '  "chainId": "', vm.toString(block.chainid), '",\n',
            '  "network": "', net.networkName, '",\n',
            '  "deployer": "', vm.toString(deployer), '",\n',
            '  "contracts": {\n',
            '    "CivisNFT": "', vm.toString(address(civisNFT)), '",\n',
            '    "CivisToken": "', vm.toString(address(civisToken)), '",\n',
            '    "CivisProofVerifier": "', vm.toString(address(civisVerifier)), '"\n',
            '  },\n',
            '  "deployedAt": "', vm.toString(block.number), '"\n',
            "}"
        );

        vm.writeFile(outputFile, json);
        console.log("");
        console.log("Deployment JSON written to:", outputFile);
    }
}
