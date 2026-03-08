'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, FileText, Upload, Zap, Gift, CheckCircle, AlertCircle, ExternalLink, Twitter, RefreshCw, Share2, Copy, Eye, Clock, Check, X } from 'lucide-react'
import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { EmailProofUpload } from './EmailProofUpload'
import { EmailProofResult } from '@/lib/vlayer'
import { mintCivisNFT, MintCivisResult, generateBlockscoutUrls, generateTwitterShareUrl, getTargetChain, getContractAddresses } from '@/lib/civis-contracts'
import { useTransactionStatus } from '@/hooks/useTransactionStatus'
import { useNFTDetails } from '@/hooks/useNFTDetails'
import { useNotificationSafe } from '@/hooks/useBlockscoutSafe'
import { createPublicClient, http } from 'viem'

type ClaimStep = 'instructions' | 'upload' | 'processing' | 'proof' | 'minting' | 'complete'

// Enhanced NFT details interface that includes direct tokenURI metadata
interface EnhancedNFTDetails {
  tokenId: string
  contractAddress: string
  name?: string
  description?: string
  image?: string
  attributes?: Array<{
    trait_type: string
    value: string | number
  }>
  metadata?: any
  tokenURI?: string
}

export function WikipediaClaim() {
  const { address, isConnected } = useAccount()
  const { switchChain } = useSwitchChain()
  const currentChainId = useChainId()
  const { openTxToast } = useNotificationSafe()
  
  const [currentStep, setCurrentStep] = useState<ClaimStep>('instructions')
  const [emailProofResult, setEmailProofResult] = useState<EmailProofResult | null>(null)
  const [mintResult, setMintResult] = useState<MintCivisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSwitchingChain, setIsSwitchingChain] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [enhancedNFTDetails, setEnhancedNFTDetails] = useState<EnhancedNFTDetails | null>(null)
  
  // Transaction status tracking
  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID || '545'
  const { status: txStatus, isPolling } = useTransactionStatus(
    mintResult?.transactionHash || null, 
    chainId
  )
  
  // NFT details fetching - get contract address from config
  const contracts = getContractAddresses()
  const { nftDetails, isLoading: isLoadingNFT, error: nftError, retryCount, maxRetries, refetch } = useNFTDetails(
    mintResult ? contracts.civisNFT : null,
    mintResult?.tokenId || null
  )

  // Fallback function to fetch NFT details from Blockscout API
  const fetchNFTFromBlockscout = async (contractAddress: string, tokenId: string) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BLOCKSCOUT_URL || 'https://creditcoin-testnet.blockscout.com'
      
      // Convert tokenId to proper format if needed
      let displayTokenId = tokenId
      try {
        if (tokenId.startsWith('0x')) {
          displayTokenId = BigInt(tokenId).toString()
        }
      } catch {
        // Keep original if conversion fails
      }
      
      // Fetch the specific NFT instance directly
      const apiUrl = `${baseUrl}/api/v2/tokens/${contractAddress}/instances/${displayTokenId}`
      
      console.log('Fetching specific NFT instance from Blockscout API:', apiUrl)
      
      const response = await fetch(apiUrl)
      if (response.ok) {
        const nftData = await response.json()
        console.log('Blockscout specific NFT data:', nftData)
        
        if (nftData) {
          return {
            tokenId: displayTokenId,
            contractAddress,
            name: nftData.metadata?.name || 'Verified Civis Proof',
            description: nftData.metadata?.description || 'Verified Civis Proof',
            image: nftData.metadata?.image || nftData.image_url,
            attributes: nftData.metadata?.attributes || [],
            metadata: nftData.metadata,
            tokenURI: nftData.token_url || `${baseUrl}/token/${contractAddress}/instance/${displayTokenId}`
          }
        }
      } else {
        console.log('Blockscout API response not ok:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching NFT from Blockscout:', error)
    }
    
    return null
  }

  // Enhanced NFT metadata fetching using direct contract call
  const fetchTokenURIMetadata = async (contractAddress: string, tokenId: string) => {
    try {
      console.log('Fetching tokenURI directly from contract...', { contractAddress, tokenId })
      
      // Create a public client for the target chain
      const targetChain = getTargetChain()
      const publicClient = createPublicClient({
        chain: targetChain,
        transport: http()
      })

      // Convert tokenId to proper BigInt - handle both hex strings and decimal strings
      let tokenIdBigInt: bigint
      if (tokenId.startsWith('0x')) {
        // It's a hex string, convert from hex
        tokenIdBigInt = BigInt(tokenId)
      } else {
        // It's a decimal string, convert normally
        tokenIdBigInt = BigInt(tokenId)
      }

      console.log('Converted tokenId to BigInt:', tokenIdBigInt.toString())

      // Call tokenURI function on the contract
      const tokenURI = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: [
          {
            "type": "function",
            "name": "tokenURI",
            "inputs": [{ "name": "tokenId", "type": "uint256" }],
            "outputs": [{ "name": "", "type": "string" }],
            "stateMutability": "view"
          }
        ],
        functionName: 'tokenURI',
        args: [tokenIdBigInt]
      })

      console.log('TokenURI from contract:', tokenURI)

      if (tokenURI) {
        console.log('Fetching metadata from:', tokenURI)
        try {
          const metadataResponse = await fetch(tokenURI)
          if (metadataResponse.ok) {
            const metadata = await metadataResponse.json()
            console.log('Successfully fetched metadata:', metadata)
            
            return {
              tokenId: tokenIdBigInt.toString(),
              contractAddress,
              name: metadata.name || 'Verified Civis Proof',
              description: metadata.description || 'Verified Civis Proof',
              image: metadata.image,
              attributes: metadata.attributes || [],
              metadata,
              tokenURI
            }
          }
        } catch (fetchError) {
          console.warn('Direct metadata fetch failed (likely CORS), trying alternative:', fetchError)
          
          // Try using a CORS proxy for external URLs
          if (tokenURI.includes('faucet.vlayer.xyz')) {
            try {
              // Use a public CORS proxy as fallback
              const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(tokenURI)}`
              const proxyResponse = await fetch(proxyUrl)
              if (proxyResponse.ok) {
                const proxyData = await proxyResponse.json()
                const metadata = JSON.parse(proxyData.contents)
                console.log('Successfully fetched metadata via CORS proxy:', metadata)
                
                return {
                  tokenId: tokenIdBigInt.toString(),
                  contractAddress,
                  name: metadata.name || 'Verified Civis Proof', 
                  description: metadata.description || 'Verified Civis Proof',
                  image: metadata.image,
                  attributes: metadata.attributes || [],
                  metadata,
                  tokenURI
                }
              }
            } catch (proxyError) {
              console.warn('CORS proxy also failed:', proxyError)
            }
          }
        }
      } else {
        console.warn('No tokenURI returned from contract')
      }
    } catch (error) {
      console.error('Failed to fetch tokenURI metadata:', error)
    }
    return null
  }

  // Enhanced NFT details effect with retry logic
  useEffect(() => {
    if (mintResult && currentStep === 'complete') {
      const loadEnhancedDetails = async () => {
        console.log('Loading enhanced NFT details...', { 
          contractAddress: contracts.civisNFT, 
          tokenId: mintResult.tokenId 
        })
        
        try {
          // Try direct contract call first
          const enhanced = await fetchTokenURIMetadata(contracts.civisNFT, mintResult.tokenId)
          if (enhanced) {
            console.log('Successfully loaded enhanced details:', enhanced)
            setEnhancedNFTDetails(enhanced)
            return
          }

          // If contract call failed, try Blockscout API as fallback
          console.log('Direct contract call failed, trying Blockscout API...')
          if (address) {
            const blockscoutData = await fetchNFTFromBlockscout(contracts.civisNFT, mintResult.tokenId)
            if (blockscoutData) {
              console.log('Successfully loaded details from Blockscout:', blockscoutData)
              setEnhancedNFTDetails(blockscoutData)
              return
            }
          }

          // Final fallback to blockscout data from useNFTDetails hook
          console.log('Blockscout API also failed, using fallback from hook')
          if (nftDetails) {
            setEnhancedNFTDetails({
              ...nftDetails,
              tokenURI: undefined
            })
          }
        } catch (error) {
          console.error('Failed to load enhanced NFT details:', error)
          // Final fallback to blockscout data
          if (nftDetails) {
            setEnhancedNFTDetails({
              ...nftDetails,
              tokenURI: undefined
            })
          }
        }
      }

      // Small delay to allow contract state to update, then retry a few times
      const timer = setTimeout(loadEnhancedDetails, 2000)
      
      // Set up retry mechanism
      const retryTimer = setTimeout(() => {
        if (!enhancedNFTDetails?.image) {
          console.log('Retrying enhanced details fetch...')
          loadEnhancedDetails()
        }
      }, 8000)
      
      return () => {
        clearTimeout(timer)
        clearTimeout(retryTimer)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mintResult, contracts.civisNFT, nftDetails, currentStep, address])

  // Handle hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Auto-progress to complete step when transaction is successful
  useEffect(() => {
    if (txStatus.status === 'success' && currentStep === 'minting') {
      // Give more time for the toast notification and let user manually proceed
      // Remove auto-progression for now - let users click the button
      console.log('Transaction successful, showing View NFT button')
    }
  }, [txStatus.status, currentStep])

  // Get target chain info
  const targetChain = getTargetChain()
  const isOnCorrectChain = mounted && currentChainId === targetChain.id

  // Check if wallet is actually connected
  const isWalletConnected = mounted && isConnected && !!address

  const handleProofGenerated = (result: EmailProofResult) => {
    console.log('Email proof generated:', result)
    setEmailProofResult(result)
    setCurrentStep('proof')
    setError(null)
  }

  const handleError = (errorMessage: string) => {
    console.error('Email proof error:', errorMessage)
    setError(errorMessage)
  }

  const handleSwitchChain = async () => {
    setIsSwitchingChain(true)
    try {
      switchChain({ chainId: targetChain.id })
    } catch (error: any) {
      console.error('Chain switch error:', error)
      setError(`Failed to switch to ${targetChain.name}. Please switch manually in your wallet.`)
    } finally {
      setIsSwitchingChain(false)
    }
  }

  const handleMintNFT = async () => {
    if (!emailProofResult || !address) {
      setError('Missing required data for minting')
      return
    }

    if (!isOnCorrectChain) {
      setError(`Please switch to ${targetChain.name} network first`)
      return
    }
    
    setCurrentStep('minting')
    setIsProcessing(true)
    
    try {
      console.log('Starting NFT minting process...')
      
      // Mint the Civis Proof NFT using the proof verifier
      const result = await mintCivisNFT({
        actionHash: emailProofResult.emailHash,
        actionValue: emailProofResult.donationAmount,
        categoryId: 0 // 0 = Donation
      }, address)
      
      console.log('NFT minting successful:', result)
      
      // Show transaction toast notification
      openTxToast(chainId, result.transactionHash)
      
      setMintResult(result)
      setCurrentStep('complete')
    } catch (error: any) {
      console.error('Minting error:', error)
      setError(`Failed to mint NFT: ${error.message}`)
      setCurrentStep('proof') // Go back to proof step
    } finally {
      setIsProcessing(false)
    }
  }

  const handleViewOnBlockscout = () => {
    if (!mintResult) return
    
    // Get the actual tokenId (convert from hex to decimal if needed)
    let displayTokenId = mintResult.tokenId
    try {
      if (mintResult.tokenId.startsWith('0x')) {
        displayTokenId = BigInt(mintResult.tokenId).toString()
      }
    } catch {
      // Keep original if conversion fails
    }
    
    // Generate direct NFT URL: [BLOCKSCOUT_URL]/token/[CONTRACT]/instance/[TOKEN_ID]
    const baseUrl = process.env.NEXT_PUBLIC_BLOCKSCOUT_URL || 'https://creditcoin-testnet.blockscout.com'
    const nftUrl = `${baseUrl}/token/${contracts.civisNFT}/instance/${displayTokenId}`
    
    window.open(nftUrl, '_blank')
  }

  const handleShareOnTwitter = () => {
    if (!emailProofResult || !mintResult) return
    
    const twitterUrl = generateTwitterShareUrl({
      donationAmount: emailProofResult.donationAmount,
      transactionHash: mintResult.transactionHash,
      tokenId: mintResult.tokenId
    })
    
    window.open(twitterUrl, '_blank')
  }

  // Helper function to get blockscout URL for addresses/transactions
  const getBlockscoutUrl = (type: 'address' | 'tx', value: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_BLOCKSCOUT_URL || 'https://creditcoin-testnet.blockscout.com'
    return `${baseUrl}/${type}/${value}`
  }

  const renderNetworkAlert = () => {
    // Don't show anything during hydration
    if (!mounted) {
      return null
    }

    if (!isConnected || !isWalletConnected) {
      return (
        <div className="alert alert-warning mb-6">
          <AlertCircle className="w-5 h-5" />
          <div>
            <h4 className="font-bold">Wallet Not Connected</h4>
            <p className="text-sm">Please connect your wallet using the button in the top right to continue</p>
          </div>
        </div>
      )
    }

    if (!isOnCorrectChain) {
      return (
        <div className="alert alert-error mb-6">
          <AlertCircle className="w-5 h-5" />
          <div>
            <h4 className="font-bold">Wrong Network</h4>
            <p className="text-sm">
              You're on chain ID {currentChainId}, but this app requires {targetChain.name} (Chain ID: {targetChain.id})
            </p>
          </div>
          <button 
            onClick={handleSwitchChain}
            disabled={isSwitchingChain}
            className="btn btn-primary btn-sm"
          >
            {isSwitchingChain ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Switching...
              </>
            ) : (
              `Switch to ${targetChain.name}`
            )}
          </button>
        </div>
      )
    }

    return null
  }

  const renderStepIndicator = () => {
    const steps = [
      { id: 'instructions', label: 'Instructions', icon: FileText },
      { id: 'upload', label: 'Upload', icon: Upload },
      { id: 'processing', label: 'Processing', icon: Zap },
      { id: 'proof', label: 'Proof', icon: CheckCircle },
      { id: 'minting', label: 'Minting', icon: Gift },
      { id: 'complete', label: 'Complete', icon: CheckCircle }
    ]

    const stepOrder = ['instructions', 'upload', 'processing', 'proof', 'minting', 'complete']
    const currentIndex = stepOrder.indexOf(currentStep)

    return (
      <div className="steps w-full mb-12">
        {steps.map((step, index) => {
          const StepIcon = step.icon
          const isActive = stepOrder[index] === currentStep
          const isCompleted = index < currentIndex
          
          return (
            <div 
              key={step.id} 
              className={`step ${isCompleted || isActive ? 'step-primary' : ''}`}
            >
              <div className={`flex flex-col items-center ${isActive ? 'text-primary' : isCompleted ? 'text-primary' : 'text-base-content/50'}`}>
                <StepIcon className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">{step.label}</span>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/claim" className="btn btn-ghost btn-circle">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Wikipedia Donation</h1>
          <p className="text-base-content/70">Claim CIVIS for supporting free knowledge</p>
        </div>
      </div>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Network Alert */}
      {renderNetworkAlert()}

      {/* Error Alert */}
      {error && (
        <div className="alert alert-error mb-6">
          <AlertCircle className="w-5 h-5" />
          <div>
            <h4 className="font-bold">Error</h4>
            <p className="text-sm">{error}</p>
          </div>
          <button 
            onClick={() => setError(null)} 
            className="btn btn-ghost btn-sm"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Step Content */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          {currentStep === 'instructions' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="text-6xl">📚</div>
                <div>
                  <h2 className="card-title text-2xl">Support Wikipedia</h2>
                  <p className="text-base-content/70">
                    Earn CIVIS tokens for donating to Wikipedia Foundation
                  </p>
                </div>
              </div>

              <div className="alert alert-info">
                <AlertCircle className="w-5 h-5" />
                <div>
                  <h3 className="font-bold">How it works</h3>
                  <div className="text-sm">
                    After donating to Wikipedia, you'll receive a confirmation email. 
                    Download that email as a .eml file and upload it here for verification using vlayer.xyz zero-knowledge proofs.
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Step 1: Make a Donation</h3>
                <div className="bg-base-200 p-4 rounded-lg">
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Visit <a href="https://donate.wikimedia.org" target="_blank" rel="noopener noreferrer" className="link link-primary">donate.wikimedia.org</a></li>
                    <li>Choose your donation amount (any amount eligible for CIVIS)</li>
                    <li>In the donation message, include your wallet address: <code className="bg-base-300 px-1 rounded text-xs">{address || '0x...'}</code></li>
                    <li>Complete the donation process</li>
                    <li>Check your email for the donation confirmation</li>
                  </ol>
                </div>

                <h3 className="text-lg font-semibold">Step 2: Get the .eml File</h3>
                <div className="bg-base-200 p-4 rounded-lg">
                  <div className="space-y-3 text-sm">
                    <p><strong>Gmail:</strong> Open email → Three dots menu → "Show original" → "Download original"</p>
                    <p><strong>Outlook:</strong> Open email → Three dots menu → "View message source" → Save as .eml</p>
                    <p><strong>Apple Mail:</strong> Open email → File menu → "Save As" → Choose "Raw Message Source"</p>
                  </div>
                </div>

                <div className="alert alert-warning">
                  <AlertCircle className="w-5 h-5" />
                  <div>
                    <h4 className="font-bold">Privacy & Security</h4>
                    <p className="text-sm">
                      vlayer.xyz uses zero-knowledge proofs to verify your donation without exposing personal information. 
                      Only the donation details and your wallet address are verified.
                    </p>
                  </div>
                </div>
              </div>

              <div className="card-actions justify-between">
                <a 
                  href="https://donate.wikimedia.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-outline"
                >
                  <ExternalLink className="w-4 h-4" />
                  Donate to Wikipedia
                </a>
                <button 
                  onClick={() => setCurrentStep('upload')}
                  className="btn btn-primary"
                >
                  I Have My .eml File
                </button>
              </div>
            </div>
          )}

          {currentStep === 'upload' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-6xl mb-4">📧</div>
                <h2 className="card-title text-2xl justify-center">Upload Your Email</h2>
                <p className="text-base-content/70">
                  Upload your Wikipedia donation confirmation email (.eml file) for vlayer verification
                </p>
              </div>

              <EmailProofUpload 
                onProofGenerated={handleProofGenerated}
                onError={handleError}
                disabled={isProcessing}
              />

              <div className="card-actions justify-between">
                <button 
                  onClick={() => setCurrentStep('instructions')}
                  className="btn btn-ghost"
                  disabled={isProcessing}
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {currentStep === 'proof' && emailProofResult && (
            <div className="space-y-6 text-center">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="card-title text-2xl justify-center">Proof Generated!</h2>
              <p className="text-base-content/70">
                Your email has been successfully verified using vlayer.xyz
              </p>

              <div className="bg-base-200 p-4 rounded-lg max-w-md mx-auto">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <div className="text-lg font-semibold text-primary">
                      Donation Amount: ${emailProofResult.donationAmount}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Verification:</span>
                    <span className="text-success flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Verified
                    </span>
                  </div>
                </div>
              </div>

              <div className="alert alert-success max-w-md mx-auto">
                <CheckCircle className="w-5 h-5" />
                <div>
                  <h4 className="font-bold">Zero-Knowledge Proof Generated</h4>
                  <p className="text-sm">
                    Your email verification proof is ready for on-chain minting
                  </p>
                </div>
              </div>

              <div className="card-actions justify-center">
                <button 
                  onClick={handleMintNFT}
                  disabled={isProcessing || !address || !isWalletConnected || !isOnCorrectChain}
                  className="btn btn-primary btn-lg"
                >
                  <Gift className="w-5 h-5" />
                  Mint Civis Proof NFT
                </button>
              </div>

              {!isWalletConnected && mounted && (
                <div className="alert alert-warning max-w-md mx-auto">
                  <AlertCircle className="w-5 h-5" />
                  <div>
                    <h4 className="font-bold">Wallet Required</h4>
                    <p className="text-sm">Please connect your wallet using the button in the top right to mint the NFT</p>
                  </div>
                </div>
              )}

              {isWalletConnected && !isOnCorrectChain && mounted && (
                <div className="alert alert-error max-w-md mx-auto">
                  <AlertCircle className="w-5 h-5" />
                  <div>
                    <h4 className="font-bold">Wrong Network</h4>
                    <p className="text-sm">Please switch to {targetChain.name} to mint the NFT</p>
                  </div>
                  <button 
                    onClick={handleSwitchChain}
                    disabled={isSwitchingChain}
                    className="btn btn-primary btn-sm"
                  >
                    {isSwitchingChain ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Switching...
                      </>
                    ) : (
                      `Switch to ${targetChain.name}`
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {currentStep === 'minting' && (
            <div className="space-y-6 text-center">
              <div className="text-7xl mb-4">🎨</div>
              <h2 className="text-3xl font-bold text-primary mb-2">Minting Your NFT</h2>
              <p className="text-lg text-base-content/70">
                Creating your soulbound proof of contribution...
              </p>
              
              {/* Transaction Status Display */}
              {mintResult ? (
                <div className="space-y-6">
                  {/* Status Indicator */}
                  <div className="flex flex-col items-center space-y-4">
                    {txStatus.status === 'pending' && (
                      <>
                        <span className="loading loading-spinner loading-lg text-primary"></span>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-warning justify-center">
                            <Clock className="w-5 h-5" />
                            <span className="text-lg font-medium">Transaction Processing...</span>
                          </div>
                          <div className="text-sm text-base-content/60 max-w-md">
                            Your NFT is being minted on-chain. This usually takes a few moments.
                          </div>
                        </div>
                      </>
                    )}
                    
                    {txStatus.status === 'success' && (
                      <>
                        <div className="text-success text-6xl">✅</div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-success justify-center">
                            <Check className="w-5 h-5" />
                            <span className="text-lg font-medium">NFT Successfully Minted!</span>
                          </div>
                          
                          {/* Simplified success summary */}
                          <div className="bg-success/10 border border-success/30 rounded-lg p-4 max-w-md mx-auto">
                            <div className="space-y-2 text-sm">
                              <div>✓ NFT created and assigned to your wallet</div>
                              {mintResult.civisTokensAmount && (
                                <div>✓ {mintResult.civisTokensAmount} CIVIS tokens earned</div>
                              )}
                              <div>✓ Donation verified using vlayer</div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                    
                    {txStatus.status === 'error' && (
                      <>
                        <div className="text-error text-5xl">❌</div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-error justify-center">
                            <X className="w-5 h-5" />
                            <span className="text-lg font-medium">Transaction Failed</span>
                          </div>
                          {txStatus.error && (
                            <div className="bg-error/10 border border-error/30 rounded-lg p-4 max-w-md mx-auto">
                              <div className="text-sm text-left">
                                <div className="font-medium mb-1">Error:</div>
                                <div className="text-xs">{txStatus.error}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                    
                    {txStatus.status === 'not_found' && (
                      <>
                        <span className="loading loading-spinner loading-lg text-warning"></span>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-warning justify-center">
                            <Clock className="w-5 h-5" />
                            <span className="text-lg font-medium">Submitting Transaction...</span>
                          </div>
                          <div className="text-sm text-base-content/60 max-w-md">
                            Waiting for the transaction to be processed by the network.
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Transaction Details - Collapsed */}
                  <details className="max-w-md mx-auto">
                    <summary className="btn btn-ghost btn-sm cursor-pointer">
                      <ExternalLink className="w-4 h-4" />
                      View Transaction Details
                    </summary>
                    <div className="mt-3 p-3 bg-base-200 rounded-lg text-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <span>Hash:</span>
                        <code>{mintResult.transactionHash.slice(0, 8)}...{mintResult.transactionHash.slice(-6)}</code>
                      </div>
                      {mintResult.civisTokensAmount && (
                        <div className="flex justify-between items-center">
                          <span>Tokens:</span>
                          <span className="font-bold text-primary">{mintResult.civisTokensAmount} CIVIS</span>
                        </div>
                      )}
                      <button
                        onClick={() => window.open(mintResult.blockscoutUrl, '_blank')}
                        className="btn btn-xs btn-outline w-full mt-2"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View on Explorer
                      </button>
                    </div>
                  </details>
                  
                  {/* Action Buttons */}
                  {txStatus.status === 'success' && (
                    <div className="pt-2">
                      <button 
                        onClick={() => setCurrentStep('complete')}
                        className="btn btn-primary btn-lg"
                      >
                        View Your NFT
                      </button>
                    </div>
                  )}
                  
                  {txStatus.status === 'error' && (
                    <div className="pt-2">
                      <button 
                        onClick={() => {
                          setMintResult(null)
                          setCurrentStep('proof')
                          setError(null)
                        }}
                        className="btn btn-outline"
                      >
                        Try Again
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col items-center space-y-4">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                    <div className="space-y-2">
                      <div className="text-lg font-medium">Preparing Transaction...</div>
                      <div className="text-sm text-base-content/60 max-w-md">
                        Please confirm the transaction in your wallet to mint your NFT.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 'complete' && emailProofResult && mintResult && (
            <div className="space-y-8 text-center">
              {/* Main Success Header */}
              <div className="space-y-4">
                <div className="text-8xl mb-4">🎉</div>
                <h1 className="text-4xl font-bold text-primary mb-2">
                  NFT Successfully Minted!
                </h1>
                <p className="text-xl text-base-content/80">
                  Your donation has been verified and immortalized on-chain
                </p>
              </div>

              {/* Main NFT Display - Made More Prominent */}
              <div className="max-w-md mx-auto">
                {isLoadingNFT && !enhancedNFTDetails ? (
                  <div className="card bg-gradient-to-br from-primary/20 to-secondary/20 border-2 border-primary/40 shadow-lg">
                    <div className="card-body items-center py-12">
                      <span className="loading loading-spinner loading-lg text-primary"></span>
                      <h3 className="text-lg font-semibold mt-4">Loading Your NFT...</h3>
                      <p className="text-sm text-base-content/60">Fetching metadata from contract...</p>
                    </div>
                  </div>
                ) : enhancedNFTDetails || nftDetails ? (
                  <div className="card bg-gradient-to-br from-primary/20 to-secondary/20 border-2 border-primary/40 shadow-lg">
                    <div className="card-body items-center py-8">
                      {/* NFT Image or Fallback */}
                      {(enhancedNFTDetails?.image || nftDetails?.image) ? (
                        <img 
                          src={enhancedNFTDetails?.image || nftDetails?.image} 
                          alt={enhancedNFTDetails?.name || nftDetails?.name || 'Civis Proof NFT'}
                          className="w-40 h-40 rounded-xl object-cover mb-4 shadow-md"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            target.nextElementSibling?.classList.remove('hidden')
                          }}
                        />
                      ) : null}
                      <div className={`text-6xl mb-4 ${(enhancedNFTDetails?.image || nftDetails?.image) ? 'hidden' : ''}`}>📚</div>
                      
                      {/* NFT Title */}
                      <h2 className="text-2xl font-bold text-primary mb-2">
                        {enhancedNFTDetails?.name || nftDetails?.name || 'Civis Proof NFT'}
                      </h2>
                      
                      {/* Description if available */}
                      {(enhancedNFTDetails?.description || nftDetails?.description) && (
                        <p className="text-sm text-base-content/70 mb-4 max-w-xs">
                          {enhancedNFTDetails?.description || nftDetails?.description}
                        </p>
                      )}
                      
                      {/* Key Details in Clean Layout */}
                      <div className="space-y-3 w-full max-w-xs">
                        <div className="bg-primary/15 px-4 py-2 rounded-lg">
                          <div className="text-lg font-bold text-primary">
                            ${emailProofResult.donationAmount} Donation
                          </div>
                        </div>
                        
                        {mintResult.civisTokensAmount && (
                          <div className="bg-secondary/15 px-4 py-2 rounded-lg">
                            <div className="text-lg font-bold text-secondary">
                              +{mintResult.civisTokensAmount} CIVIS Tokens
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Clean Badges */}
                      <div className="flex gap-2 mt-4">
                        <div className="badge badge-primary">Soulbound</div>
                        <div className="badge badge-success">Verified</div>
                      </div>

                      {/* Attributes if available */}
                      {((enhancedNFTDetails?.attributes || nftDetails?.attributes) && 
                        (enhancedNFTDetails?.attributes || nftDetails?.attributes)!.length > 0) && (
                        <div className="w-full mt-4">
                          <h4 className="text-sm font-medium mb-2">Attributes</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {(enhancedNFTDetails?.attributes || nftDetails?.attributes)?.slice(0, 4).map((attr, index) => (
                              <div key={index} className="bg-base-200 p-2 rounded text-xs">
                                <div className="font-medium">{attr.trait_type}</div>
                                <div className="text-base-content/70">{attr.value}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="card bg-gradient-to-br from-primary/20 to-secondary/20 border-2 border-primary/40 shadow-lg">
                    <div className="card-body items-center py-8">
                      <div className="text-6xl mb-4">📚</div>
                      <h2 className="text-2xl font-bold text-primary mb-2">
                        Civis Proof NFT
                      </h2>
                      
                      {/* Key Details */}
                      <div className="space-y-3 w-full max-w-xs">
                        <div className="bg-primary/15 px-4 py-2 rounded-lg">
                          <div className="text-lg font-bold text-primary">
                            ${emailProofResult.donationAmount} Donation
                          </div>
                        </div>
                        
                        {mintResult.civisTokensAmount && (
                          <div className="bg-secondary/15 px-4 py-2 rounded-lg">
                            <div className="text-lg font-bold text-secondary">
                              +{mintResult.civisTokensAmount} CIVIS Tokens
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Clean Badges */}
                      <div className="flex gap-2 mt-4">
                        <div className="badge badge-primary">Soulbound</div>
                        <div className="badge badge-success">Verified</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
                <button 
                  onClick={handleViewOnBlockscout}
                  className="btn btn-outline btn-wide"
                >
                  <ExternalLink className="w-4 h-4" />
                  View on Explorer
                </button>
                
                <button 
                  onClick={handleShareOnTwitter}
                  className="btn btn-primary btn-wide"
                >
                  <Twitter className="w-4 h-4" />
                  Share Achievement
                </button>
              </div>

              {/* Enhanced Technical Details - Collapsed by Default */}
              <details className="max-w-lg mx-auto">
                <summary className="btn btn-ghost btn-sm cursor-pointer">
                  <Eye className="w-4 h-4" />
                  View Technical Details
                </summary>
                <div className="mt-4 p-4 bg-base-200 rounded-lg text-sm space-y-3">
                  {/* Token ID */}
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Token ID:</span>
                    <code className="bg-base-300 px-2 py-1 rounded text-xs">
                      {(() => {
                        // Convert hex tokenId to decimal for display
                        try {
                          if (mintResult.tokenId.startsWith('0x')) {
                            return BigInt(mintResult.tokenId).toString()
                          }
                          return mintResult.tokenId
                        } catch {
                          return mintResult.tokenId
                        }
                      })()}
                    </code>
                  </div>
                  
                  {/* Contract Address */}
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Contract:</span>
                    <div className="flex items-center gap-2">
                      <code className="bg-base-300 px-2 py-1 rounded text-xs">
                        {contracts.civisNFT}
                      </code>
                      <button
                        onClick={() => window.open(getBlockscoutUrl('address', contracts.civisNFT), '_blank')}
                        className="btn btn-xs btn-ghost"
                        title="View contract on Blockscout"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Transaction Hash */}
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Transaction:</span>
                    <div className="flex items-center gap-2">
                      <code className="bg-base-300 px-2 py-1 rounded text-xs">
                        {mintResult.transactionHash}
                      </code>
                      <button
                        onClick={() => window.open(getBlockscoutUrl('tx', mintResult.transactionHash), '_blank')}
                        className="btn btn-xs btn-ghost"
                        title="View transaction on Blockscout"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Token URI if available */}
                  {enhancedNFTDetails?.tokenURI && (
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Metadata URI:</span>
                      <div className="flex items-center gap-2">
                        <code className="bg-base-300 px-2 py-1 rounded text-xs max-w-48 truncate">
                          {enhancedNFTDetails.tokenURI}
                        </code>
                        <button
                          onClick={() => window.open(enhancedNFTDetails.tokenURI!, '_blank')}
                          className="btn btn-xs btn-ghost"
                          title="View metadata JSON"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Wallet Address */}
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Owner:</span>
                    <div className="flex items-center gap-2">
                      <code className="bg-base-300 px-2 py-1 rounded text-xs">
                        {address}
                      </code>
                      {address && (
                        <button
                          onClick={() => window.open(getBlockscoutUrl('address', address), '_blank')}
                          className="btn btn-xs btn-ghost"
                          title="View wallet on Blockscout"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </details>

              {/* Return to Dashboard */}
              <div className="pt-4">
                <Link href="/dashboard" className="btn btn-primary btn-lg">
                  Continue to Dashboard
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 