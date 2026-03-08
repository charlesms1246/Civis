# Civis — Real-World Contribution Proofs on Creditcoin

> Prove your public contributions on-chain. Earn soulbound CIVIS tokens and NFTs for verified charitable donations, volunteering, and real-world public good. Built on Creditcoin — the RWA blockchain.

[![Built on Creditcoin](https://img.shields.io/badge/Chain-Creditcoin%20Testnet-10b981)](https://creditcoin.org)
[![ZK Proofs by vlayer](https://img.shields.io/badge/ZK%20Proofs-vlayer-blue)](https://vlayer.xyz)
[![Explorer](https://img.shields.io/badge/Explorer-Blockscout-orange)](https://creditcoin-testnet.blockscout.com)

---

## What Is Civis?

Real-world public contributions — charitable donations, volunteering, environmental actions, education, healthcare, and community service — are invisible to the world. There is no universal, verifiable, tamper-proof record of human contribution. Existing platforms are siloed, centralised, and easily manipulated. Good deeds leave no permanent trace.

Civis solves this using zero-knowledge email proofs. When you donate to a recognised charity, you receive a confirmation email. Civis lets you upload that email and uses [vlayer](https://vlayer.xyz)'s `EmailProofLib` to cryptographically verify the DKIM signature — proving the email genuinely came from the charity's domain — without revealing your personal details. This proof is then submitted on-chain to Creditcoin.

The result: a permanent, privacy-preserving, soulbound record of your real-world contribution. Every verified action mints a **Civis Proof NFT** (CPF) and awards non-transferable **CIVIS tokens** — building an immutable global reputation ledger on Creditcoin, the Real-World Asset blockchain. Good deeds become **Visible, Verifiable, and Valued**.

---

## Network Information

| Parameter | Value |
|---|---|
| Network Name | Creditcoin Testnet |
| Chain ID | `102031` |
| RPC URL | `https://rpc.cc3-testnet.creditcoin.network` |
| Native Token | `tCTC` |
| Block Explorer | `https://creditcoin-testnet.blockscout.com` |

---

## Deployed Contracts (Creditcoin Testnet)

> These are testnet addresses deployed at block 4,389,952. Mainnet addresses will be published at mainnet launch.

| Contract | Address |
|---|---|
| CivisNFT | [`0xb3Df63Ac5Ec5648d2E764a7C579148F29858E99D`](https://creditcoin-testnet.blockscout.com/address/0xb3Df63Ac5Ec5648d2E764a7C579148F29858E99D) |
| CivisToken | [`0x558298297E714312D5670dBe4dbc15E1D240a811`](https://creditcoin-testnet.blockscout.com/address/0x558298297E714312D5670dBe4dbc15E1D240a811) |
| CivisProofVerifier | [`0x96A4978752D0fC8FccDe3c168A6a9E1c20B62330`](https://creditcoin-testnet.blockscout.com/address/0x96A4978752D0fC8FccDe3c168A6a9E1c20B62330) |
| WikipediaProver | [`0xfccf01179c3e6ab33796a9d2804380d1c609b3ba`](https://creditcoin-testnet.blockscout.com/address/0xfccf01179c3e6ab33796a9d2804380d1c609b3ba) |
| RedCrossProver | [`0x53e11f0bf461f87a8783c45b1880a5c6c1aefc34`](https://creditcoin-testnet.blockscout.com/address/0x53e11f0bf461f87a8783c45b1880a5c6c1aefc34) |
| MSFProver | [`0x8ac436e5bb681ae4d576e0131391ae3aaca88bde`](https://creditcoin-testnet.blockscout.com/address/0x8ac436e5bb681ae4d576e0131391ae3aaca88bde) |

---

## Supported Proof Types

| Action | Charity Domain | Claim Route |
|---|---|---|
| Wikipedia / Wikimedia Donation | `wikimedia.org` | `/claim/wikipedia-donation` |
| Red Cross Donation | `redcross.org` | `/claim/red-cross-donation` |
| Médecins Sans Frontières Donation | `msf.org` | `/claim/msf-donation` |

---

## Architecture Overview

```
User uploads .eml file
      │
      ▼
vlayer off-chain prover (EmailDomainProver)
  - Verifies DKIM signature against charity domain
  - Extracts donor domain & donation amount
  - Returns (Proof, emailHash, actionValue)
      │
      ▼
CivisProofVerifier.verify(actionHash, actionValue, categoryId)
  - Checks replay prevention (usedHashes mapping)
  - Mints CivisNFT (ERC-5484 soulbound, symbol: CPF)
  - Mints 20 CIVIS tokens (ERC-20 soulbound)
      │
      ▼
Creditcoin Testnet (Chain ID: 102031)
  CivisNFT:           0xb3Df63Ac5Ec5648d2E764a7C579148F29858E99D
  CivisToken:         0x558298297E714312D5670dBe4dbc15E1D240a811
  CivisProofVerifier: 0x96A4978752D0fC8FccDe3c168A6a9E1c20B62330
```

---

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-org/civis.git
cd civis

# 2. Install frontend dependencies
cd app
npm install

# 3. Install contract dependencies
cd ../contracts
forge soldeer install

# 4. Configure environment
cd ../app
cp env.example .env.local
# Edit .env.local and populate contract addresses and API keys (see env.example for guidance)

# 5. Start the development server
npm run dev
# Visit http://localhost:3030
```

See [docs/DEVELOPER.md](docs/DEVELOPER.md) for the full development guide including local Anvil testing, Creditcoin Testnet deployment, and vlayer proof configuration.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | [Next.js 15](https://nextjs.org) (App Router, RSC) |
| Wallet Infrastructure | [RainbowKit v2](https://www.rainbowkit.com) + [Wagmi v2](https://wagmi.sh) |
| EVM Client | [viem](https://viem.sh) |
| ZK Email Proofs | [vlayer SDK](https://vlayer.xyz) (`@vlayer/sdk`) |
| Smart Contracts | [Solidity 0.8.x](https://soliditylang.org) via [Foundry](https://getfoundry.sh) |
| Contract Libraries | [Solady](https://github.com/Vectorized/solady) (ERC-721, ERC-20, access control) |
| Contract Standards | [OpenZeppelin Contracts 5](https://openzeppelin.com/contracts) |
| Block Explorer | [Blockscout](https://blockscout.com) SDK + Merits |
| Styling | [Tailwind CSS v3](https://tailwindcss.com) |

---

## NFT Categories

Civis supports six Real-World Asset contribution categories:

| Category | Description |
|---|---|
| Donation | Verified charitable financial contributions |
| Volunteering | Verified time and labour contributions |
| Environmental | Verified green actions and conservation efforts |
| Education | Verified educational contributions and mentorship |
| Healthcare | Verified healthcare and medical aid contributions |
| Community | Verified local and community service contributions |

---


## Links

- [Creditcoin](https://creditcoin.org) — The RWA Layer 1 blockchain
- [vlayer](https://vlayer.xyz) — ZK email & web proofs
- [Blockscout Explorer](https://creditcoin-testnet.blockscout.com) — Creditcoin Testnet block explorer
- [Blockscout Merits](https://merits.blockscout.com) — Cross-chain loyalty rewards
- [Developer Guide](docs/DEVELOPER.md)
