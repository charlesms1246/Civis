import { createPublicClient, createWalletClient, custom, http, parseEther, Log, defineChain } from 'viem'
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

// Contract ABIs
export const KARMA_NFT_ABI = [
  {
    "type": "function",
    "name": "mint",
    "inputs": [
      { "name": "to", "type": "address" },
      { "name": "tokenId", "type": "uint256" },
      { "name": "_burnAuth", "type": "uint8" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "tokenURI",
    "inputs": [{ "name": "tokenId", "type": "uint256" }],
    "outputs": [{ "name": "", "type": "string" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "ownerOf",
    "inputs": [{ "name": "tokenId", "type": "uint256" }],
    "outputs": [{ "name": "", "type": "address" }],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "Issued",
    "inputs": [
      { "name": "from", "type": "address", "indexed": true },
      { "name": "to", "type": "address", "indexed": true },
      { "name": "tokenId", "type": "uint256", "indexed": true },
      { "name": "burnAuth", "type": "uint8" }
    ]
  }
] as const

export const KARMA_PROOF_VERIFIER_ABI = [
  {
    "type": "function",
    "name": "verify",
    "inputs": [
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
                        {
                            "name": "verifierSelector",
                            "type": "bytes4",
                            "internalType": "bytes4"
                        },
                        {
                            "name": "seal",
                            "type": "bytes32[8]",
                            "internalType": "bytes32[8]"
                        },
                        {
                            "name": "mode",
                            "type": "uint8",
                            "internalType": "enum ProofMode"
                        }
                    ]
                },
                {
                    "name": "callGuestId",
                    "type": "bytes32",
                    "internalType": "bytes32"
                },
                {
                    "name": "length",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "callAssumptions",
                    "type": "tuple",
                    "internalType": "struct CallAssumptions",
                    "components": [
                        {
                            "name": "proverContractAddress",
                            "type": "address",
                            "internalType": "address"
                        },
                        {
                            "name": "functionSelector",
                            "type": "bytes4",
                            "internalType": "bytes4"
                        },
                        {
                            "name": "settleChainId",
                            "type": "uint256",
                            "internalType": "uint256"
                        },
                        {
                            "name": "settleBlockNumber",
                            "type": "uint256",
                            "internalType": "uint256"
                        },
                        {
                            "name": "settleBlockHash",
                            "type": "bytes32",
                            "internalType": "bytes32"
                        }
                    ]
                }
            ]
        },
        {
            "name": "_karmaHash",
            "type": "bytes32",
            "internalType": "bytes32"
        },
        {
            "name": "_donationAmount",
            "type": "string",
            "internalType": "string"
        }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
},
{
    "type": "function",
    "name": "verifySkip",
    "inputs": [
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
                        {
                            "name": "verifierSelector",
                            "type": "bytes4",
                            "internalType": "bytes4"
                        },
                        {
                            "name": "seal",
                            "type": "bytes32[8]",
                            "internalType": "bytes32[8]"
                        },
                        {
                            "name": "mode",
                            "type": "uint8",
                            "internalType": "enum ProofMode"
                        }
                    ]
                },
                {
                    "name": "callGuestId",
                    "type": "bytes32",
                    "internalType": "bytes32"
                },
                {
                    "name": "length",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "callAssumptions",
                    "type": "tuple",
                    "internalType": "struct CallAssumptions",
                    "components": [
                        {
                            "name": "proverContractAddress",
                            "type": "address",
                            "internalType": "address"
                        },
                        {
                            "name": "functionSelector",
                            "type": "bytes4",
                            "internalType": "bytes4"
                        },
                        {
                            "name": "settleChainId",
                            "type": "uint256",
                            "internalType": "uint256"
                        },
                        {
                            "name": "settleBlockNumber",
                            "type": "uint256",
                            "internalType": "uint256"
                        },
                        {
                            "name": "settleBlockHash",
                            "type": "bytes32",
                            "internalType": "bytes32"
                        }
                    ]
                }
            ]
        },
        {
            "name": "_karmaHash",
            "type": "bytes32",
            "internalType": "bytes32"
        },
        {
            "name": "_donationAmount",
            "type": "string",
            "internalType": "string"
        }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
}
] as const

// KarmaToken ABI - minimal for redeem function
export const KARMA_TOKEN_ABI = [
  {
    "type": "function",
    "name": "redeem",
    "inputs": [
      {
        "name": "amount",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "balanceOf",
    "inputs": [
      {
        "name": "account",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "Redeemed",
    "inputs": [
      {
        "name": "user",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  }
] as const

// Get contract addresses from environment variables
export function getContractAddresses() {
  const karmaNFT = process.env.NEXT_PUBLIC_KARMA_NFT_CONTRACT
  const karmaProofVerifier = process.env.NEXT_PUBLIC_VLAYER_VERIFIER_CONTRACT_ADDRESS
  const prover = process.env.NEXT_PUBLIC_VLAYER_PROVER_CONTRACT_ADDRESS
  const karmaToken = process.env.NEXT_PUBLIC_KARMA_TOKEN_CONTRACT
  
  if (!karmaNFT || !karmaProofVerifier || !prover || !karmaToken) {
    throw new Error('Missing required contract addresses in environment variables')
  }
  
  return {
    karmaNFT: karmaNFT as `0x${string}`,
    karmaProofVerifier: karmaProofVerifier as `0x${string}`,
    prover: prover as `0x${string}`,
    karmaToken: karmaToken as `0x${string}`,
  }
}

// Create viem clients with dynamic chain
export const createClients = () => {
  const chain = getDynamicChain()
  
  const publicClient = createPublicClient({
    chain,
    transport: http()
  })

  // For wallet client, we'll create it with custom transport when needed
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

export interface MintNFTParams {
  proof: any
  emailHash: string
  donationAmount: string
}

export interface MintNFTResult {
  transactionHash: string
  tokenId: string
  blockscoutUrl: string
  karmaTokensAmount?: string
  receipt?: any
}

// Helper function to request chain switch
export async function requestChainSwitch(targetChainId: number) {
  if (typeof window !== 'undefined' && window.ethereum) {
    try {
      console.log(`Attempting to switch to chain ID: ${targetChainId}`)
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      })
      console.log(`Successfully switched to chain ID: ${targetChainId}`)
      return true
    } catch (error: any) {
      console.log(`Switch failed for chain ID ${targetChainId}, error code: ${error.code}`, error)
      
      // If chain doesn't exist, try to add it
      if (error.code === 4902) {
        const targetChain = getTargetChain()
        console.log(`Attempting to add chain: ${targetChain.name}`, targetChain)
        
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${targetChainId.toString(16)}`,
              chainName: targetChain.name,
              nativeCurrency: targetChain.nativeCurrency,
              rpcUrls: targetChain.rpcUrls.default.http,
              blockExplorerUrls: targetChain.blockExplorers ? [targetChain.blockExplorers.default.url] : undefined,
            }],
          })
          console.log(`Successfully added chain: ${targetChain.name}`)
          return true
        } catch (addError: any) {
          console.error('Failed to add chain:', addError)
          throw new Error(`Failed to add ${targetChain.name} to your wallet. Please add it manually.`)
        }
      }
      
      // For other errors (like user rejection)
      if (error.code === 4001) {
        throw new Error(`User rejected the network switch to ${getTargetChain().name}.`)
      }
      
      throw new Error(`Failed to switch to the correct network. Please switch to ${getTargetChain().name} manually.`)
    }
  }
  throw new Error('No wallet detected')
}

// Main function to mint Karma NFT with proof verification
export async function mintKarmaNFT(
  params: MintNFTParams,
  userAddress: string
): Promise<MintNFTResult> {
  const { proof, emailHash, donationAmount } = params
  const contracts = getContractAddresses()
  const { publicClient, getWalletClient, chain } = createClients()
  
  const walletClient = getWalletClient()
  
  if (!walletClient) {
    throw new Error('Wallet not connected')
  }

  // Check current chain and switch if necessary
  const targetChainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '545')
  
  // Check if SKIP_VERIFY is enabled for demo mode
  const skipVerify = process.env.NEXT_PUBLIC_SKIP_VERIFY === 'true'
  
  try {
    // Get current chain from wallet
    const currentChainId = await window.ethereum?.request({ method: 'eth_chainId' })
    const currentChainIdNumber = parseInt(currentChainId, 16)
    
    if (currentChainIdNumber !== targetChainId) {
      throw new Error(`Please switch to chain ID ${targetChainId}. Currently on chain ID ${currentChainIdNumber}`)
    }

    // Get the connected account from the wallet client
    const [connectedAccount] = await walletClient.getAddresses()
    
    if (!connectedAccount) {
      throw new Error('No account connected to wallet')
    }

    console.log('Minting NFT with params:', {
      verifier: contracts.karmaProofVerifier,
      proof: proof,
      emailHash: emailHash,
      donationAmount: donationAmount,
      account: connectedAccount,
      skipVerify: skipVerify,
      functionName: skipVerify ? 'verifySkip' : 'verify'
    })

    // Ensure emailHash is properly formatted as hex string
    const formattedEmailHash = emailHash.startsWith('0x') ? emailHash : `0x${emailHash}`

    // Call the verifier contract - use verifySkip for demo mode, verify for normal mode
    const functionName = skipVerify ? 'verifySkip' : 'verify'
    const hash = await walletClient.writeContract({
      address: contracts.karmaProofVerifier as `0x${string}`,
      abi: KARMA_PROOF_VERIFIER_ABI,
      functionName: functionName,
      args: [proof, formattedEmailHash as `0x${string}`, donationAmount],
      account: connectedAccount,
      chain: chain
    })

    console.log('Transaction submitted:', hash)

    // Generate blockscout URL using the same logic as generateBlockscoutUrls
    let blockscoutUrl: string
    if (chain.id === 31337) {
      blockscoutUrl = `http://localhost:8545/tx/${hash}` // Placeholder for local development
    } else {
      // Creditcoin Testnet or any other chain — use Blockscout
      blockscoutUrl = `${process.env.NEXT_PUBLIC_BLOCKSCOUT_URL || 'https://creditcoin-testnet.blockscout.com'}/tx/${hash}`
    }

    // Wait for transaction receipt to get confirmation and extract events
    let receipt = null
    let karmaTokensAmount = '10' // Default amount from contract
    let actualTokenId = emailHash // Fallback to emailHash if we can't extract from events
    
    try {
      console.log('Waiting for transaction receipt...')
      receipt = await publicClient.waitForTransactionReceipt({ 
        hash: hash,
        timeout: 60_000 // 60 second timeout
      })
      
      console.log('Transaction receipt:', receipt)
      
      // Extract actual tokenId from Issued event
      if (receipt.logs && receipt.logs.length > 0) {
        // Look for KarmaNFT Issued event (keccak256("Issued(address,address,uint256,uint8)"))
        const issuedTopic = '0x27f6a4b7c1b4c4b5a6b2f9b6b8c4b5a6b2f9b6b8c4b5a6b2f9b6b8c4b5a6b2f9' // This needs to be the correct hash
        
        // Since we don't have the exact topic hash, let's look for events from our NFT contract
        const nftContractLogs = receipt.logs.filter((log: any) => 
          log.address && log.address.toLowerCase() === contracts.karmaNFT.toLowerCase()
        )
        
        console.log('NFT contract logs:', nftContractLogs)
        
        // Look for Transfer event which should contain the tokenId (ERC721 Transfer has tokenId as 3rd topic)
        const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
        const transferLog = nftContractLogs.find((log: any) => 
          log.topics[0] === transferTopic
        )
        
        if (transferLog && transferLog.topics.length >= 4) {
          // In ERC721 Transfer event, topics are: [Transfer signature, from, to, tokenId]
          const tokenIdHex = transferLog.topics[3]
          if (tokenIdHex) {
            actualTokenId = BigInt(tokenIdHex).toString() // Convert to decimal string
            console.log('Extracted actual tokenId from Transfer event:', actualTokenId)
          }
        }
        
        // Also extract karma token amount from Transfer event if available
        const karmaTokenTransferLog = receipt.logs.find((log: any) => 
          log.topics[0] === transferTopic && 
          log.address?.toLowerCase() === contracts.karmaToken.toLowerCase()
        )
        
        if (karmaTokenTransferLog && karmaTokenTransferLog.data) {
          try {
            // Decode the amount from the log data (3rd parameter of Transfer event)
            const amountHex = karmaTokenTransferLog.data
            const amountWei = BigInt(amountHex)
            const amountEther = Number(amountWei) / Math.pow(10, 18) // Convert from wei to ether
            karmaTokensAmount = amountEther.toString()
            console.log('Extracted karma tokens amount:', karmaTokensAmount)
          } catch (error) {
            console.warn('Failed to decode karma token amount from logs:', error)
          }
        }
      }
    } catch (error) {
      console.warn('Failed to wait for transaction receipt:', error)
      // Continue without receipt - the transaction was still submitted
    }

    return {
      transactionHash: hash,
      tokenId: actualTokenId,
      blockscoutUrl,
      karmaTokensAmount,
      receipt
    }
  } catch (error: any) {
    console.error('Error minting Karma NFT:', error)
    throw new Error(`Failed to mint Karma NFT: ${error.message}`)
  }
}

// Interface for Blockscout URL generation
export interface BlockscoutUrls {
  token: string
  tokenInstance: string
  transaction: string | null
  contract: string
}

// Generate Blockscout URLs
export function generateBlockscoutUrls(tokenId: string, transactionHash?: string): BlockscoutUrls {
  const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '102031')
  const contracts = getContractAddresses()
  
  // For anvil/local development, use placeholder URLs
  if (chainId === 31337) {
    return {
      token: `http://localhost:8545/token/${contracts.karmaNFT}`,
      tokenInstance: `http://localhost:8545/token/${contracts.karmaNFT}/instance/${tokenId}`,
      transaction: transactionHash ? `http://localhost:8545/tx/${transactionHash}` : null,
      contract: `http://localhost:8545/address/${contracts.karmaNFT}`
    }
  }
  
  // Creditcoin Testnet or any other chain
  const baseUrl = process.env.NEXT_PUBLIC_BLOCKSCOUT_URL || 'https://creditcoin-testnet.blockscout.com'
  return {
    token: `${baseUrl}/token/${contracts.karmaNFT}`,
    tokenInstance: `${baseUrl}/token/${contracts.karmaNFT}/instance/${tokenId}`,
    transaction: transactionHash ? `${baseUrl}/tx/${transactionHash}` : null,
    contract: `${baseUrl}/address/${contracts.karmaNFT}`
  }
}

// Generate Twitter share text
export function generateTwitterShareText(params: {
  donationAmount: string
  transactionHash?: string
  tokenId?: string
}) {
  const { donationAmount, transactionHash } = params
  const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '102031')
  
  let text = `🎉 Just earned Karma points for donating ${donationAmount} to Wikipedia! `
  text += `Supporting free knowledge and earning soulbound NFTs with vlayer zero-knowledge proofs. `
  text += `#Karma #Web3ForGood #Wikipedia #vlayer #ZKProofs`
  
  if (transactionHash && chainId !== 31337) {
    const baseUrl = process.env.NEXT_PUBLIC_BLOCKSCOUT_URL || 'https://creditcoin-testnet.blockscout.com'
    text += `\n\nView proof: ${baseUrl}/tx/${transactionHash}`
  }
  
  return encodeURIComponent(text)
}

// Generate Twitter share URL
export function generateTwitterShareUrl(params: {
  donationAmount: string
  transactionHash?: string
  tokenId?: string
}) {
  const text = generateTwitterShareText(params)
  return `https://twitter.com/intent/tweet?text=${text}`
}

// Interface for karma token redemption
export interface RedeemKarmaResult {
  transactionHash: string
  blockscoutUrl: string
  amountBurned: string
  receipt?: any
}

// Function to redeem (burn) karma tokens
export async function redeemKarmaTokens(
  amount: string,
  userAddress: string
): Promise<RedeemKarmaResult> {
  const contracts = getContractAddresses()
  const { publicClient, getWalletClient, chain } = createClients()
  
  const walletClient = getWalletClient()
  
  if (!walletClient) {
    throw new Error('Wallet not connected')
  }

  // Check current chain and switch if necessary
  const targetChainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '545')
  
  try {
    // Get current chain from wallet
    const currentChainId = await window.ethereum?.request({ method: 'eth_chainId' })
    const currentChainIdNumber = parseInt(currentChainId, 16)
    
    if (currentChainIdNumber !== targetChainId) {
      throw new Error(`Please switch to chain ID ${targetChainId}. Currently on chain ID ${currentChainIdNumber}`)
    }

    // Get the connected account from the wallet client
    const [connectedAccount] = await walletClient.getAddresses()
    
    if (!connectedAccount) {
      throw new Error('No account connected to wallet')
    }

    // Convert amount to wei (assuming 18 decimals)
    const amountWei = BigInt(Number(amount) * Math.pow(10, 18))

    console.log('Redeeming Karma tokens with params:', {
      contract: contracts.karmaToken,
      amount: amount,
      amountWei: amountWei.toString(),
      account: connectedAccount
    })

    // Call the redeem function on KarmaToken contract
    const hash = await walletClient.writeContract({
      address: contracts.karmaToken as `0x${string}`,
      abi: KARMA_TOKEN_ABI,
      functionName: 'redeem',
      args: [amountWei],
      account: connectedAccount,
      chain: chain
    })

    console.log('Redeem transaction submitted:', hash)

    // Generate blockscout URL
    let blockscoutUrl: string
    if (chain.id === 31337) {
      blockscoutUrl = `http://localhost:8545/tx/${hash}`
    } else {
      blockscoutUrl = `${process.env.NEXT_PUBLIC_BLOCKSCOUT_URL || 'https://creditcoin-testnet.blockscout.com'}/tx/${hash}`
    }

    // Wait for transaction receipt
    let receipt = null
    try {
      console.log('Waiting for redeem transaction receipt...')
      receipt = await publicClient.waitForTransactionReceipt({ 
        hash: hash,
        timeout: 60_000 // 60 second timeout
      })
      
      console.log('Redeem transaction receipt:', receipt)
    } catch (error) {
      console.warn('Failed to wait for transaction receipt:', error)
      // Continue without receipt - the transaction was still submitted
    }

    return {
      transactionHash: hash,
      blockscoutUrl,
      amountBurned: amount,
      receipt
    }
  } catch (error: any) {
    console.error('Error redeeming Karma tokens:', error)
    throw new Error(`Failed to redeem Karma tokens: ${error.message}`)
  }
}

// Function to get karma token balance
export async function getKarmaTokenBalance(userAddress: string): Promise<string> {
  try {
    const contracts = getContractAddresses()
    const chain = getDynamicChain()
    
    const publicClient = createPublicClient({
      chain,
      transport: http()
    })

    const balance = await publicClient.readContract({
      address: contracts.karmaToken as `0x${string}`,
      abi: KARMA_TOKEN_ABI,
      functionName: 'balanceOf',
      args: [userAddress as `0x${string}`]
    })

    // Balance is returned in wei, convert to readable format
    return (Number(balance) / 10**18).toString()
  } catch (error) {
    console.error('Error fetching karma token balance:', error)
    return '0'
  }
}

// Interface for NFT metadata
export interface NFTMetadata {
  id: string
  title: string
  description: string
  category: string
  karmaPoints: number
  dateEarned: string
  imageUrl: string
  verified: boolean
  isRealNFT: boolean
  contractAddress: string
  tokenId: string
  blockchainVerified: boolean
  transactionHash?: string
}

// Fetch user's Karma NFTs from blockchain
export async function getUserKarmaNFTs(userAddress: string): Promise<NFTMetadata[]> {
  try {
    const contracts = getContractAddresses()
    const nfts: NFTMetadata[] = []

    // Try Blockscout API first (most reliable)
    try {
      const blockscoutNFTs = await fetchNFTsFromBlockscout(userAddress, contracts.karmaNFT)
      nfts.push(...blockscoutNFTs)
    } catch (error) {
      console.warn('Blockscout API failed, trying event logs fallback:', error)
      
      // Fallback to event logs
      const eventNFTs = await fetchNFTsFromEvents(userAddress, contracts.karmaNFT)
      nfts.push(...eventNFTs)
    }

    return nfts
  } catch (error) {
    console.error('Error fetching user NFTs:', error)
    return []
  }
}

// Fetch NFTs using Blockscout API
async function fetchNFTsFromBlockscout(userAddress: string, contractAddress: string): Promise<NFTMetadata[]> {
  const blockscoutUrl = process.env.NEXT_PUBLIC_BLOCKSCOUT_URL || 'https://creditcoin-testnet.blockscout.com'

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
        // Fetch token metadata
        const metadata = await fetchNFTMetadata(item.id, contractAddress)
        if (metadata) {
          nfts.push(metadata)
        }
      }
    }
  }

  return nfts
}

// Fetch NFTs using event logs (fallback method)
async function fetchNFTsFromEvents(userAddress: string, contractAddress: string): Promise<NFTMetadata[]> {
  const chain = getDynamicChain()
  const publicClient = createPublicClient({
    chain,
    transport: http()
  })

  const nfts: NFTMetadata[] = []

  try {
    // Get Transfer events where the user is the recipient
    const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef' // Transfer(address,address,uint256)
    
    const logs = await publicClient.getLogs({
      address: contractAddress as `0x${string}`,
      event: {
        type: 'event',
        name: 'Transfer',
        inputs: [
          { name: 'from', type: 'address', indexed: true },
          { name: 'to', type: 'address', indexed: true },
          { name: 'tokenId', type: 'uint256', indexed: true }
        ]
      },
      args: {
        to: userAddress as `0x${string}`
      },
      fromBlock: 'earliest',
      toBlock: 'latest'
    })

    for (const log of logs) {
      if (log.topics && log.topics.length >= 4) {
        const tokenIdHex = log.topics[3]
        const tokenId = parseInt(tokenIdHex, 16).toString()
        
        // Check if user still owns this NFT
        try {
          const owner = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: KARMA_NFT_ABI,
            functionName: 'ownerOf',
            args: [BigInt(tokenId)]
          })

          if (owner && owner.toLowerCase() === userAddress.toLowerCase()) {
            const metadata = await fetchNFTMetadata(tokenId, contractAddress)
            if (metadata) {
              nfts.push(metadata)
            }
          }
        } catch (error) {
          // Token might not exist anymore (burned)
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
async function fetchNFTMetadata(tokenId: string, contractAddress: string): Promise<NFTMetadata | null> {
  try {
    const chain = getDynamicChain()
    const publicClient = createPublicClient({
      chain,
      transport: http()
    })

    // Get token URI
    const tokenURI = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: KARMA_NFT_ABI,
      functionName: 'tokenURI',
      args: [BigInt(tokenId)]
    })

    // For now, create metadata based on the tokenId
    // In a real implementation, you would fetch from the tokenURI
    const metadata: NFTMetadata = {
      id: `real-nft-${tokenId}`,
      title: `Karma NFT #${tokenId}`,
      description: `Verified karma proof NFT minted on-chain. This represents a verified good deed that earned you karma tokens.`,
      category: 'Verified Deed',
      karmaPoints: 100, // Could be extracted from tokenURI metadata
      dateEarned: new Date().toISOString().split('T')[0], // Could be extracted from blockchain timestamp
      imageUrl: '/nft/gift-wiki.png', // Default to Wikipedia donation image
      verified: true,
      isRealNFT: true,
      contractAddress,
      tokenId,
      blockchainVerified: true,
    }

    // Try to fetch actual metadata from tokenURI if it's a valid URL
    if (tokenURI.startsWith('http')) {
      try {
        const metadataResponse = await fetch(tokenURI)
        if (metadataResponse.ok) {
          const onChainMetadata = await metadataResponse.json()
          
          // Update metadata with on-chain data
          if (onChainMetadata.name) metadata.title = onChainMetadata.name
          if (onChainMetadata.description) metadata.description = onChainMetadata.description
          if (onChainMetadata.image) metadata.imageUrl = onChainMetadata.image
          if (onChainMetadata.attributes) {
            const categoryAttr = onChainMetadata.attributes.find((attr: any) => attr.trait_type === 'Category')
            if (categoryAttr) metadata.category = categoryAttr.value
            
            const karmaAttr = onChainMetadata.attributes.find((attr: any) => attr.trait_type === 'Karma Points')
            if (karmaAttr) metadata.karmaPoints = parseInt(karmaAttr.value) || 100
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