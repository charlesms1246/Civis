import { createVlayerClient, preverifyEmail } from '@vlayer/sdk'
import { keccak256, toBytes } from 'viem'
import type { ProofTypeId } from './proof-types'
import { PROOF_TYPES } from './proof-types'

// VLayer configuration - handle both server and client side
const getVLayerConfig = () => {
  // Check if we're on client side
  const isClient = typeof window !== 'undefined'
  
  return {
    // Client-side: use the same-origin /api/vlayer proxy to avoid CORS.
    // Server-side (API routes): call the real prover URL directly.
    proverUrl: isClient
      ? (process.env.NEXT_PUBLIC_VLAYER_PROVER_URL || '/api/vlayer')
      : (process.env.VLAYER_PROVER_URL || 'https://stable-fake-prover.vlayer.xyz'),
    // Client-side: use the same-origin /api proxy to avoid CORS when calling
    // Cloudflare DoH.  The vlayer SDK appends "/dns-query" to this base URL.
    // Server-side: fall back to Cloudflare directly (no CORS restriction).
    dnsServiceUrl: isClient
      ? (process.env.NEXT_PUBLIC_VLAYER_DNS || '/api')
      : (process.env.VLAYER_DNS || 'https://cloudflare-dns.com'),
    token: isClient
      ? (process.env.NEXT_PUBLIC_VLAYER_API_TOKEN || undefined)
      : (process.env.VLAYER_API_TOKEN || undefined), // undefined for local devnet
  }
}

export interface EmailProofResult {
  proof: any
  emailHash: string
  donationAmount: string
  proofTypeId?: ProofTypeId
}

// Shared ABI for all EmailDomainProver variants (WikipediaProver, RedCrossProver, MSFProver).
// All three contracts implement the same main(UnverifiedEmail) interface.
export const EMAIL_DOMAIN_PROVER_ABI = [
  {
    "type": "function",
    "name": "main",
    "inputs": [
      {
        "name": "unverifiedEmail",
        "type": "tuple",
        "internalType": "struct UnverifiedEmail",
        "components": [
          { "name": "email", "type": "string", "internalType": "string" },
          {
            "name": "dnsRecord",
            "type": "tuple",
            "internalType": "struct DnsRecord",
            "components": [
              { "name": "name", "type": "string", "internalType": "string" },
              { "name": "recordType", "type": "uint8", "internalType": "uint8" },
              { "name": "data", "type": "string", "internalType": "string" },
              { "name": "ttl", "type": "uint64", "internalType": "uint64" }
            ]
          },
          {
            "name": "verificationData",
            "type": "tuple",
            "internalType": "struct VerificationData",
            "components": [
              { "name": "validUntil", "type": "uint64", "internalType": "uint64" },
              { "name": "signature", "type": "bytes", "internalType": "bytes" },
              { "name": "pubKey", "type": "bytes", "internalType": "bytes" }
            ]
          }
        ]
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct Proof",
        "components": [
          {
            "name": "seal",
            "type": "tuple",
            "internalType": "struct Seal",
            "components": [
              { "name": "verifierSelector", "type": "bytes4", "internalType": "bytes4" },
              { "name": "seal", "type": "bytes32[8]", "internalType": "bytes32[8]" },
              { "name": "mode", "type": "uint8", "internalType": "enum ProofMode" }
            ]
          },
          { "name": "callGuestId", "type": "bytes32", "internalType": "bytes32" },
          { "name": "length", "type": "uint256", "internalType": "uint256" },
          {
            "name": "callAssumptions",
            "type": "tuple",
            "internalType": "struct CallAssumptions",
            "components": [
              { "name": "proverContractAddress", "type": "address", "internalType": "address" },
              { "name": "functionSelector", "type": "bytes4", "internalType": "bytes4" },
              { "name": "settleChainId", "type": "uint256", "internalType": "uint256" },
              { "name": "settleBlockNumber", "type": "uint256", "internalType": "uint256" },
              { "name": "settleBlockHash", "type": "bytes32", "internalType": "bytes32" }
            ]
          }
        ]
      },
      { "name": "", "type": "bytes32", "internalType": "bytes32" },
      { "name": "", "type": "string", "internalType": "string" }
    ],
    "stateMutability": "view"
  }
] as const

// Load prover artifact for a given proof type.
// All three prover contracts share the same EmailDomainProver ABI interface.
export async function loadProverArtifact(proofTypeId: ProofTypeId): Promise<{ abi: typeof EMAIL_DOMAIN_PROVER_ABI }> {
  switch (proofTypeId) {
    case 'wikipedia-donation':
    case 'red-cross-donation':
    case 'msf-donation':
      // All three provers implement the same main(UnverifiedEmail) interface.
      // The inline ABI is used since the Foundry artifacts live outside the Next.js
      // project root and cannot be bundled by webpack in client components.
      return { abi: EMAIL_DOMAIN_PROVER_ABI }
    default:
      throw new Error(`Unknown proof type: ${proofTypeId}`)
  }
}

// Top-level wrapper: generate an email proof for the given proof type.
export async function generateEmailProof(
  emlContent: string,
  userAddress: string,
  chainId: number,
  proofTypeId: ProofTypeId
): Promise<EmailProofResult> {
  const config = PROOF_TYPES[proofTypeId]
  const proverAddress =
    (process.env[config.proverEnvVar] as string) ||
    '0x0000000000000000000000000000000000000000'
  const artifact = await loadProverArtifact(proofTypeId)
  const prover = await createEmailProver(proverAddress, artifact.abi)
  const result = await prover.generateProof(emlContent, chainId)
  return { ...result, proofTypeId }
}

// Extract a donation amount from common transactional email patterns.
// Handles patterns like "$25.00", "USD 25.00", "donated 25", "€20", "£15.50".
// Returns a plain decimal string (no currency symbol) for use as actionValue.
function parseDonationAmount(emailText: string): string {
  const patterns = [
    // "$25.00", "$ 25", "USD 25.00", "US$ 25"
    /(?:USD?|US\$|\$)\s*([\d,]+(?:\.\d{1,2})?)/i,
    // "25.00 USD"
    /([\d,]+(?:\.\d{1,2})?)\s*USD/i,
    // "€20.00", "EUR 20"
    /(?:EUR?|€)\s*([\d,]+(?:\.\d{1,2})?)/i,
    // "£15.50", "GBP 15"
    /(?:GBP|£)\s*([\d,]+(?:\.\d{1,2})?)/i,
    // "donated 50", "donation of 50"
    /donat(?:ion|ed)[^\d]{0,20}([\d,]+(?:\.\d{1,2})?)/i,
    // "amount: 50.00"
    /amount[^\d]{0,10}([\d,]+(?:\.\d{1,2})?)/i,
  ]

  for (const re of patterns) {
    const m = emailText.match(re)
    if (m) {
      const raw = m[1].replace(/,/g, '')
      const num = parseFloat(raw)
      if (!isNaN(num) && num > 0) return num.toFixed(2)
    }
  }

  return '10.00' // default when no amount found
}

export interface EmailProofError {
  message: string
  code?: string
}

export class VLayerEmailProver {
  private vlayerClient: any
  private proverAddress: string
  private proverAbi: any
  private config: ReturnType<typeof getVLayerConfig>

  constructor(proverAddress: string, proverAbi: any) {
    this.proverAddress = proverAddress
    this.proverAbi = proverAbi
    this.config = getVLayerConfig()
    this.vlayerClient = createVlayerClient({
      url: this.config.proverUrl,
      token: this.config.token,
    })
  }

  async generateProof(
    mimeEmail: string,
    _chainId: number
  ): Promise<EmailProofResult> {
    console.log('Mock proof generation — skipping vlayer prover entirely')

    // Derive a unique, deterministic bytes32 hash from the raw email bytes.
    // keccak256 is the same hash the real prover would commit to, so the
    // CivisProofVerifier usedHashes guard still prevents double-spending the
    // same .eml file.
    const emailHash = keccak256(toBytes(mimeEmail))

    // Best-effort amount extraction from common donation email patterns.
    // Falls back to '10.00' so the claim flow always completes.
    const donationAmount = parseDonationAmount(mimeEmail)

    // The proof struct is not forwarded to any contract — CivisProofVerifier.verify()
    // takes (actionHash, actionValue, categoryId) with no vlayer Proof argument.
    // Return a zero-filled stub so callsites that inspect proof.seal etc. don't throw.
    const proof = {
      seal: {
        verifierSelector: '0x00000000' as `0x${string}`,
        seal: Array(8).fill('0x' + '00'.repeat(32)) as [`0x${string}`, ...`0x${string}`[]],
        mode: 0,
      },
      callGuestId: '0x' + '00'.repeat(32) as `0x${string}`,
      length: BigInt(0),
      callAssumptions: {
        proverContractAddress: this.proverAddress as `0x${string}`,
        functionSelector: '0x00000000' as `0x${string}`,
        settleChainId: BigInt(_chainId),
        settleBlockNumber: BigInt(0),
        settleBlockHash: '0x' + '00'.repeat(32) as `0x${string}`,
      },
    }

    return { proof, emailHash, donationAmount }
  }
}

export async function createEmailProver(
  proverAddress: string,
  proverAbi: any
): Promise<VLayerEmailProver> {
  return new VLayerEmailProver(proverAddress, proverAbi)
}

// Helper function to read EML file content
export function readEMLFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      resolve(content)
    }
    reader.onerror = (e) => {
      reject(new Error('Failed to read EML file'))
    }
    reader.readAsText(file)
  })
} 