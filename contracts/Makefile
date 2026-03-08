# Deployment commands for Civis contracts
# Usage:
#   make deploy-testnet PRIVATE_KEY=0x...
#   make simulate-testnet
#   make deploy-local

.PHONY: deploy-testnet simulate-testnet deploy-local

## Deploy to Creditcoin Testnet (requires PRIVATE_KEY env var)
deploy-testnet:
	forge script script/DeployCivis.s.sol \
		--rpc-url creditcoin_testnet \
		--evm-version london \
		--broadcast \
		--verify \
		--verifier blockscout \
		--verifier-url https://creditcoin-testnet.blockscout.com/api \
		--private-key $(PRIVATE_KEY)

## Simulate deployment against Creditcoin Testnet (no broadcast, no key required)
simulate-testnet:
	forge script script/DeployCivis.s.sol \
		--rpc-url creditcoin_testnet \
		--evm-version london

## Deploy to local Anvil for development
## WARNING: Uses Anvil Account #0 default key — NEVER use on a real network
deploy-local:
	forge script script/DeployCivis.s.sol \
		--rpc-url anvil_local \
		--evm-version london \
		--broadcast \
		--private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
