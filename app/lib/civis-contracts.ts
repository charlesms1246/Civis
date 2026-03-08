import { createPublicClient, createWalletClient, custom, http } from 'viem'
import { creditcoinTestnet, anvilLocal } from './wagmi'

// Get the target chain based on environment
export const getTargetChain = () => {
  const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '102031')

  if (chainId === 31337) {
    return anvilLocal
  } else {
    return creditcoinTestnet
  }
}

// Dynamic chain configuration based on environment
const getDynamicChain = () => {
  const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '102031')

  if (chainId === 31337) {
    return anvilLocal
  } else {
    return creditcoinTestnet
  }
}

// CivisNFT ABI — soulbound NFT with 4-param mint (adds actionValue)
export const CIVIS_NFT_ABI = [
  {
    "type": "function",
    "name": "mint",
    "inputs": [
      { "name": "to", "type": "address", "internalType": "address" },
      { "name": "tokenId", "type": "uint256", "internalType": "uint256" },
      { "name": "_burnAuth", "type": "uint8", "internalType": "uint8" },
      { "name": "actionValue", "type": "string", "internalType": "string" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "tokenURI",
    "inputs": [{ "name": "tokenId", "type": "uint256", "internalType": "uint256" }],
    "outputs": [{ "name": "", "type": "string" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "ownerOf",
    "inputs": [{ "name": "tokenId", "type": "uint256", "internalType": "uint256" }],
    "outputs": [{ "name": "", "type": "address" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "burnAuth",
    "inputs": [{ "name": "tokenId", "type": "uint256", "internalType": "uint256" }],
    "outputs": [{ "name": "", "type": "uint8" }],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "Issued",
    "inputs": [
      { "name": "from", "type": "address", "indexed": true },
      { "name": "to", "type": "address", "indexed": true },
      { "name": "tokenId", "type": "uint256", "indexed": true },
      { "name": "burnAuth", "type": "uint8", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "Transfer",
    "inputs": [
      { "name": "from", "type": "address", "indexed": true },
      { "name": "to", "type": "address", "indexed": true },
      { "name": "tokenId", "type": "uint256", "indexed": true }
    ]
  },
  {
    "type": "function",
    "name": "actionValues",
    "inputs": [{ "name": "tokenId", "type": "uint256", "internalType": "uint256" }],
    "outputs": [{ "name": "", "type": "string" }],
    "stateMutability": "view"
  }
] as const

// Map a stored actionValue (format: "proofTypeId|amount" or legacy "amount") to
// the correct NFT artwork. Falls back to the Wikipedia image for legacy tokens.
function imageUrlFromActionValue(actionValue: string): string {
  const proofType = actionValue.split('|')[0]
  switch (proofType) {
    case 'red-cross-donation': return '/nft/redcross.png'
    case 'msf-donation':       return '/nft/msf.png'
    case 'wikipedia-donation': return '/nft/wiki.png'
    default:                   return '/nft/wiki.png' // legacy tokens stored plain amount
  }
}

// CivisProofVerifier ABI — simplified direct verify (no vlayer Proof struct)
export const CIVIS_PROOF_VERIFIER_ABI = [
  {
    "type": "function",
    "name": "verify",
    "inputs": [
      { "name": "_actionHash", "type": "bytes32", "internalType": "bytes32" },
      { "name": "_actionValue", "type": "string", "internalType": "string" },
      { "name": "_categoryId", "type": "uint8", "internalType": "uint8" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "usedHashes",
    "inputs": [
      { "name": "", "type": "bytes32", "internalType": "bytes32" }
    ],
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "rewardAmount",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "owner",
    "inputs": [],
    "outputs": [{ "name": "", "type": "address" }],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "ActionVerified",
    "inputs": [
      { "name": "user", "type": "address", "indexed": true },
      { "name": "actionHash", "type": "bytes32", "indexed": true },
      { "name": "categoryId", "type": "uint8", "indexed": false },
      { "name": "tokenId", "type": "uint256", "indexed": false }
    ]
  }
] as const

// CivisToken ABI — non-transferable ERC20 reward token
export const CIVIS_TOKEN_ABI = [
  {
    "type": "function",
    "name": "redeem",
    "inputs": [
      { "name": "amount", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "balanceOf",
    "inputs": [
      { "name": "account", "type": "address", "internalType": "address" }
    ],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "Redeemed",
    "inputs": [
      { "name": "user", "type": "address", "indexed": true },
      { "name": "amount", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "Transfer",
    "inputs": [
      { "name": "from", "type": "address", "indexed": true },
      { "name": "to", "type": "address", "indexed": true },
      { "name": "value", "type": "uint256", "indexed": false }
    ]
  }
] as const

// Resolve deployed contract addresses from environment
export function getContractAddresses() {
  const civisNFT = process.env.NEXT_PUBLIC_CIVIS_NFT_CONTRACT
  const civisToken = process.env.NEXT_PUBLIC_CIVIS_TOKEN_CONTRACT
  const civisVerifier = process.env.NEXT_PUBLIC_CIVIS_VERIFIER_CONTRACT

  if (!civisNFT || !civisToken || !civisVerifier) {
    throw new Error(
      'Missing Civis contract addresses. Run the deployment script and populate app/.env.local'
    )
  }

  return {
    civisNFT: civisNFT as `0x${string}`,
    civisToken: civisToken as `0x${string}`,
    civisVerifier: civisVerifier as `0x${string}`,
  }
}

// Create viem clients with dynamic chain
export const createClients = () => {
  const chain = getDynamicChain()

  const publicClient = createPublicClient({
    chain,
    transport: http()
  })

  const getWalletClient = () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      return createWalletClient({
        chain,
        transport: custom(window.ethereum)
      })
    }
    return null
  }

  return { publicClient, getWalletClient, chain }
}

// Helper to request a chain switch via the wallet provider.
// Strategy:
//   1. Try wallet_switchEthereumChain.
//   2. If the switch fails for any reason other than explicit user rejection
//      (4001), attempt wallet_addEthereumChain — many wallets return -32603,
//      -32000, or other codes instead of the canonical 4902 when the chain is
//      not yet in their list.
//   3. After a successful add, retry wallet_switchEthereumChain once.
export async function requestChainSwitch(targetChainId: number) {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No wallet detected')
  }

  const chainIdHex = `0x${targetChainId.toString(16)}`

  // ── Step 1: attempt switch ────────────────────────────────────────────────
  try {
    console.log(`Attempting wallet_switchEthereumChain to ${targetChainId}`)
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex }],
    })
    console.log(`Switched to chain ${targetChainId}`)
    return true
  } catch (switchError: any) {
    console.log(`Switch failed (code ${switchError?.code}):`, switchError?.message)

    // User explicitly rejected → propagate immediately
    if (switchError?.code === 4001) {
      throw new Error(`Network switch rejected. Please approve switching to Creditcoin Testnet in your wallet.`)
    }
  }

  // ── Step 2: add the chain (covers 4902 and any other "unknown chain" code) ─
  const targetChain = getTargetChain()
  try {
    console.log(`Attempting wallet_addEthereumChain for ${targetChain.name}`)
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: chainIdHex,
        chainName: targetChain.name,
        nativeCurrency: targetChain.nativeCurrency,
        rpcUrls: targetChain.rpcUrls.default.http,
        blockExplorerUrls: targetChain.blockExplorers
          ? [targetChain.blockExplorers.default.url]
          : undefined,
      }],
    })
    console.log(`Added chain ${targetChain.name}`)
  } catch (addError: any) {
    console.log(`wallet_addEthereumChain failed (code ${addError?.code}):`, addError?.message)
    if (addError?.code === 4001) {
      throw new Error(`Network add rejected. Please approve adding Creditcoin Testnet in your wallet.`)
    }
    throw new Error(`Could not add Creditcoin Testnet to your wallet: ${addError?.message}`)
  }

  // ── Step 3: retry switch after successful add ─────────────────────────────
  try {
    console.log(`Retrying wallet_switchEthereumChain after add`)
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex }],
    })
    console.log(`Switched to chain ${targetChainId} after add`)
    return true
  } catch (retryError: any) {
    console.error('Switch retry failed:', retryError)
    throw new Error(`Added Creditcoin Testnet but could not switch to it: ${retryError?.message}`)
  }
}

// Params for minting a Civis Proof NFT
export interface MintCivisParams {
  /** keccak256 hash of the verifiable action (replaces emailHash) */
  actionHash: string
  /** Human-readable value from the action (e.g. donation amount) */
  actionValue: string
  /** Category index: 0=Donation, 1=Volunteering, 2=Environmental, 3=Education, 4=Healthcare, 5=Community */
  categoryId: number
}

export interface MintCivisResult {
  transactionHash: string
  tokenId: string
  blockscoutUrl: string
  civisTokensAmount?: string
  receipt?: any
}

// Mint a Civis Proof NFT by calling CivisProofVerifier.verify()
export async function mintCivisNFT(
  params: MintCivisParams,
  userAddress: string
): Promise<MintCivisResult> {
  const { actionHash, actionValue, categoryId } = params
  const contracts = getContractAddresses()
  const { publicClient, getWalletClient, chain } = createClients()

  const walletClient = getWalletClient()

  if (!walletClient) {
    throw new Error('Wallet not connected')
  }

  const targetChainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '102031')

  try {
    // Ensure wallet is on the correct chain — prompt a switch if needed
    const currentChainId = await window.ethereum?.request({ method: 'eth_chainId' })
    const currentChainIdNumber = parseInt(currentChainId, 16)

    if (currentChainIdNumber !== targetChainId) {
      await requestChainSwitch(targetChainId)
    }

    const [connectedAccount] = await walletClient.getAddresses()
    if (!connectedAccount) {
      throw new Error('No account connected to wallet')
    }

    console.log('Minting Civis NFT with params:', {
      verifier: contracts.civisVerifier,
      actionHash,
      actionValue,
      categoryId,
      account: connectedAccount,
    })

    // Ensure actionHash is properly 0x-prefixed
    const formattedActionHash = actionHash.startsWith('0x')
      ? actionHash
      : `0x${actionHash}`

    // Call CivisProofVerifier.verify — no vlayer Proof struct required
    const hash = await walletClient.writeContract({
      address: contracts.civisVerifier,
      abi: CIVIS_PROOF_VERIFIER_ABI,
      functionName: 'verify',
      args: [formattedActionHash as `0x${string}`, actionValue, categoryId],
      account: connectedAccount,
      chain: chain,
    })

    console.log('Transaction submitted:', hash)

    let blockscoutUrl: string
    if (chain.id === 31337) {
      blockscoutUrl = `http://localhost:8545/tx/${hash}`
    } else {
      blockscoutUrl = `${
        process.env.NEXT_PUBLIC_BLOCKSCOUT_URL || 'https://creditcoin-testnet.blockscout.com'
      }/tx/${hash}`
    }

    let receipt = null
    let civisTokensAmount = '10' // Default reward amount
    let actualTokenId = actionHash // Fallback until we extract from events

    try {
      console.log('Waiting for transaction receipt...')
      receipt = await publicClient.waitForTransactionReceipt({
        hash: hash,
        timeout: 60_000,
      })

      console.log('Transaction receipt:', receipt)

      if (receipt.logs && receipt.logs.length > 0) {
        const transferTopic =
          '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef' // keccak256("Transfer(address,address,uint256)")

        // Extract tokenId from ERC721 Transfer event on CivisNFT
        const nftLogs = receipt.logs.filter(
          (log: any) =>
            log.address &&
            log.address.toLowerCase() === contracts.civisNFT.toLowerCase()
        )

        const nftTransferLog = nftLogs.find(
          (log: any) => log.topics[0] === transferTopic
        )

        if (nftTransferLog && nftTransferLog.topics.length >= 4) {
          const tokenIdHex = nftTransferLog.topics[3]
          if (tokenIdHex) {
            actualTokenId = BigInt(tokenIdHex).toString()
            console.log('Extracted tokenId from NFT Transfer event:', actualTokenId)
          }
        }

        // Extract CIVIS token amount from ERC20 Transfer event on CivisToken
        const tokenTransferLog = receipt.logs.find(
          (log: any) =>
            log.topics[0] === transferTopic &&
            log.address?.toLowerCase() === contracts.civisToken.toLowerCase()
        )

        if (tokenTransferLog && tokenTransferLog.data) {
          try {
            const amountWei = BigInt(tokenTransferLog.data)
            civisTokensAmount = (Number(amountWei) / Math.pow(10, 18)).toString()
            console.log('Extracted CIVIS tokens amount:', civisTokensAmount)
          } catch (error) {
            console.warn('Failed to decode CIVIS token amount from logs:', error)
          }
        }
      }
    } catch (error) {
      console.warn('Failed to wait for transaction receipt:', error)
      // Continue — transaction was still submitted
    }

    return {
      transactionHash: hash,
      tokenId: actualTokenId,
      blockscoutUrl,
      civisTokensAmount,
      receipt,
    }
  } catch (error: any) {
    console.error('Error minting Civis NFT:', error)
    throw new Error(`Failed to mint Civis NFT: ${error.message}`)
  }
}

// Interface for Blockscout URL generation
export interface BlockscoutUrls {
  token: string
  tokenInstance: string
  transaction: string | null
  contract: string
}

// Generate Blockscout URLs for a given tokenId
export function generateBlockscoutUrls(
  tokenId: string,
  transactionHash?: string
): BlockscoutUrls {
  const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '102031')
  const contracts = getContractAddresses()

  // Local Blockscout instance for Anvil development
  if (chainId === 31337) {
    return {
      token: `http://localhost:4000/token/${contracts.civisNFT}`,
      tokenInstance: `http://localhost:4000/token/${contracts.civisNFT}/instance/${tokenId}`,
      transaction: transactionHash
        ? `http://localhost:4000/tx/${transactionHash}`
        : null,
      contract: `http://localhost:4000/address/${contracts.civisNFT}`,
    }
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_BLOCKSCOUT_URL ||
    'https://creditcoin-testnet.blockscout.com'
  return {
    token: `${baseUrl}/token/${contracts.civisNFT}`,
    tokenInstance: `${baseUrl}/token/${contracts.civisNFT}/instance/${tokenId}`,
    transaction: transactionHash ? `${baseUrl}/tx/${transactionHash}` : null,
    contract: `${baseUrl}/address/${contracts.civisNFT}`,
  }
}

// Generate Twitter share text for a verified public contribution
export function generateTwitterShareText(params: {
  actionType?: string
  donationAmount?: string
  transactionHash?: string
  tokenId?: string
}) {
  const { donationAmount, transactionHash } = params
  const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '102031')

  let text = donationAmount
    ? `🎉 Just earned CIVIS tokens for a verified public contribution of ${donationAmount} on Creditcoin! `
    : `🎉 Just earned CIVIS tokens for a verified public contribution on Creditcoin! `
  text += `Making public contributions Visible, Verifiable, and Valued. `
  text += `#Civis #Creditcoin #RWA #PublicGood #SoulboundNFT`

  if (transactionHash && chainId !== 31337) {
    const baseUrl =
      process.env.NEXT_PUBLIC_BLOCKSCOUT_URL ||
      'https://creditcoin-testnet.blockscout.com'
    text += `\n\nView proof: ${baseUrl}/tx/${transactionHash}`
  }

  return encodeURIComponent(text)
}

// Generate Twitter share URL
export function generateTwitterShareUrl(params: {
  actionType?: string
  donationAmount?: string
  transactionHash?: string
  tokenId?: string
}) {
  const text = generateTwitterShareText(params)
  return `https://twitter.com/intent/tweet?text=${text}`
}

// Result type for CIVIS token redemption
export interface RedeemCivisResult {
  transactionHash: string
  blockscoutUrl: string
  amountBurned: string
  receipt?: any
}

// Redeem (burn) CIVIS tokens
export async function redeemCivisTokens(
  amount: string,
  userAddress: string
): Promise<RedeemCivisResult> {
  const contracts = getContractAddresses()
  const { publicClient, getWalletClient, chain } = createClients()

  const walletClient = getWalletClient()

  if (!walletClient) {
    throw new Error('Wallet not connected')
  }

  const targetChainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '102031')

  try {
    // Ensure wallet is on the correct chain — prompt a switch if needed
    const currentChainId = await window.ethereum?.request({ method: 'eth_chainId' })
    const currentChainIdNumber = parseInt(currentChainId, 16)

    if (currentChainIdNumber !== targetChainId) {
      await requestChainSwitch(targetChainId)
    }

    const [connectedAccount] = await walletClient.getAddresses()
    if (!connectedAccount) {
      throw new Error('No account connected to wallet')
    }

    // Convert amount to wei (18 decimals)
    const amountWei = BigInt(Math.floor(Number(amount) * Math.pow(10, 18)))

    console.log('Redeeming CIVIS tokens:', {
      contract: contracts.civisToken,
      amount,
      amountWei: amountWei.toString(),
      account: connectedAccount,
    })

    const hash = await walletClient.writeContract({
      address: contracts.civisToken,
      abi: CIVIS_TOKEN_ABI,
      functionName: 'redeem',
      args: [amountWei],
      account: connectedAccount,
      chain: chain,
    })

    console.log('Redeem transaction submitted:', hash)

    let blockscoutUrl: string
    if (chain.id === 31337) {
      blockscoutUrl = `http://localhost:8545/tx/${hash}`
    } else {
      blockscoutUrl = `${
        process.env.NEXT_PUBLIC_BLOCKSCOUT_URL || 'https://creditcoin-testnet.blockscout.com'
      }/tx/${hash}`
    }

    let receipt = null
    try {
      console.log('Waiting for redeem transaction receipt...')
      receipt = await publicClient.waitForTransactionReceipt({
        hash: hash,
        timeout: 60_000,
      })
      console.log('Redeem transaction receipt:', receipt)
    } catch (error) {
      console.warn('Failed to wait for redeem receipt:', error)
    }

    return {
      transactionHash: hash,
      blockscoutUrl,
      amountBurned: amount,
      receipt,
    }
  } catch (error: any) {
    console.error('Error redeeming CIVIS tokens:', error)
    throw new Error(`Failed to redeem CIVIS tokens: ${error.message}`)
  }
}

// Get CIVIS token balance for a wallet address
export async function getCivisTokenBalance(userAddress: string): Promise<string> {
  try {
    const contracts = getContractAddresses()
    const chain = getDynamicChain()

    const publicClient = createPublicClient({
      chain,
      transport: http(),
    })

    const balance = await publicClient.readContract({
      address: contracts.civisToken,
      abi: CIVIS_TOKEN_ABI,
      functionName: 'balanceOf',
      args: [userAddress as `0x${string}`],
    })

    return (Number(balance) / 10 ** 18).toString()
  } catch (error) {
    console.error('Error fetching CIVIS token balance:', error)
    return '0'
  }
}

// Interface for NFT metadata
// category is one of: Donation, Volunteering, Environmental, Education, Healthcare, Community
export interface NFTMetadata {
  id: string
  title: string
  description: string
  category: string
  civisPoints: number
  dateEarned: string
  imageUrl: string
  verified: boolean
  isRealNFT: boolean
  contractAddress: string
  tokenId: string
  blockchainVerified: boolean
  transactionHash?: string
}

// Fetch all Civis Proof NFTs owned by a wallet address
export async function getUserCivisNFTs(userAddress: string): Promise<NFTMetadata[]> {
  try {
    const contracts = getContractAddresses()
    const nfts: NFTMetadata[] = []

    try {
      const blockscoutNFTs = await fetchNFTsFromBlockscout(userAddress, contracts.civisNFT)
      nfts.push(...blockscoutNFTs)
    } catch (error) {
      console.warn('Blockscout API failed, trying event logs fallback:', error)
      const eventNFTs = await fetchNFTsFromEvents(userAddress, contracts.civisNFT)
      nfts.push(...eventNFTs)
    }

    return nfts
  } catch (error) {
    console.error('Error fetching user Civis NFTs:', error)
    return []
  }
}

// Fetch NFTs via Blockscout API
async function fetchNFTsFromBlockscout(
  userAddress: string,
  contractAddress: string
): Promise<NFTMetadata[]> {
  const blockscoutUrl =
    process.env.NEXT_PUBLIC_BLOCKSCOUT_URL || 'https://creditcoin-testnet.blockscout.com'

  const apiUrl = `${blockscoutUrl}/api/v2/addresses/${userAddress}/nft?type=ERC-721&filter=${contractAddress}`

  const response = await fetch(apiUrl)
  if (!response.ok) {
    throw new Error(`Blockscout API error: ${response.status}`)
  }

  const data = await response.json()
  const nfts: NFTMetadata[] = []

  if (data.items && Array.isArray(data.items)) {
    for (const item of data.items) {
      if (item.token?.address?.toLowerCase() === contractAddress.toLowerCase()) {
        const metadata = await fetchNFTMetadata(item.id, contractAddress)
        if (metadata) {
          nfts.push(metadata)
        }
      }
    }
  }

  return nfts
}

// Fetch NFTs via Transfer event logs (fallback)
async function fetchNFTsFromEvents(
  userAddress: string,
  contractAddress: string
): Promise<NFTMetadata[]> {
  const chain = getDynamicChain()
  const publicClient = createPublicClient({
    chain,
    transport: http(),
  })

  const nfts: NFTMetadata[] = []

  try {
    const logs = await publicClient.getLogs({
      address: contractAddress as `0x${string}`,
      event: {
        type: 'event',
        name: 'Transfer',
        inputs: [
          { name: 'from', type: 'address', indexed: true },
          { name: 'to', type: 'address', indexed: true },
          { name: 'tokenId', type: 'uint256', indexed: true },
        ],
      },
      args: {
        to: userAddress as `0x${string}`,
      },
      fromBlock: 'earliest',
      toBlock: 'latest',
    })

    for (const log of logs) {
      if (log.topics && log.topics.length >= 4) {
        const tokenIdHex = log.topics[3]
        const tokenId = parseInt(tokenIdHex, 16).toString()

        try {
          const owner = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: CIVIS_NFT_ABI,
            functionName: 'ownerOf',
            args: [BigInt(tokenId)],
          })

          if (owner && owner.toLowerCase() === userAddress.toLowerCase()) {
            const metadata = await fetchNFTMetadata(tokenId, contractAddress)
            if (metadata) {
              nfts.push(metadata)
            }
          }
        } catch (error) {
          console.warn(`Token ${tokenId} no longer exists:`, error)
        }
      }
    }
  } catch (error) {
    console.error('Error fetching NFTs from events:', error)
  }

  return nfts
}

// Fetch individual NFT metadata
async function fetchNFTMetadata(
  tokenId: string,
  contractAddress: string
): Promise<NFTMetadata | null> {
  try {
    const chain = getDynamicChain()
    const publicClient = createPublicClient({
      chain,
      transport: http(),
    })

    const tokenURI = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: CIVIS_NFT_ABI,
      functionName: 'tokenURI',
      args: [BigInt(tokenId)],
    })

    // Read the stored actionValue from the contract so we can pick the right artwork.
    // Format is "proofTypeId|amount" for tokens minted after the encoding update,
    // or a plain amount string for legacy tokens.
    let storedActionValue = ''
    try {
      storedActionValue = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: CIVIS_NFT_ABI,
        functionName: 'actionValues',
        args: [BigInt(tokenId)],
      }) as string
    } catch (_) { /* older ABI — ignore */ }

    const metadata: NFTMetadata = {
      id: `civis-nft-${tokenId}`,
      title: `Civis Proof #${tokenId}`,
      description: `Soulbound Civis Proof NFT for verified public contributions on Creditcoin`,
      category: 'Donation', // Default — overridden if on-chain metadata available
      civisPoints: 100,
      dateEarned: new Date().toISOString().split('T')[0],
      imageUrl: imageUrlFromActionValue(storedActionValue),
      verified: true,
      isRealNFT: true,
      contractAddress,
      tokenId,
      blockchainVerified: true,
    }

    // Enrich from tokenURI if it resolves to JSON
    if (tokenURI.startsWith('http')) {
      try {
        const metaResponse = await fetch(tokenURI)
        if (metaResponse.ok) {
          const onChainMeta = await metaResponse.json()

          if (onChainMeta.name) metadata.title = onChainMeta.name
          if (onChainMeta.description) metadata.description = onChainMeta.description
          if (onChainMeta.image) metadata.imageUrl = onChainMeta.image
          if (onChainMeta.attributes) {
            const categoryAttr = onChainMeta.attributes.find(
              (attr: any) => attr.trait_type === 'Category'
            )
            if (categoryAttr) metadata.category = categoryAttr.value

            const pointsAttr = onChainMeta.attributes.find(
              (attr: any) => attr.trait_type === 'Civis Points'
            )
            if (pointsAttr) metadata.civisPoints = parseInt(pointsAttr.value) || 100
          }
        }
      } catch (error) {
        console.warn('Could not fetch metadata from tokenURI:', error)
      }
    }

    return metadata
  } catch (error) {
    console.error(`Error fetching metadata for token ${tokenId}:`, error)
    return null
  }
}
