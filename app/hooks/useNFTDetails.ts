import { useState, useEffect, useCallback, useRef } from 'react'

export interface NFTDetails {
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
}

export function useNFTDetails(contractAddress: string | null, tokenId: string | null) {
  const [nftDetails, setNftDetails] = useState<NFTDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const blockscoutUrl = process.env.NEXT_PUBLIC_BLOCKSCOUT_URL || 'https://creditcoin-testnet.blockscout.com'
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const maxRetries = 5

  const fetchNFTDetails = useCallback(async (address: string, id: string): Promise<NFTDetails | null> => {
    try {
      console.log('Fetching NFT details for:', { address, id, attempt: retryCount + 1 })
      console.log('Blockscout URL:', blockscoutUrl)
      
      // First, get basic token info
      const tokenUrl = `${blockscoutUrl}/api/v2/tokens/${address}`
      console.log('Fetching token info from:', tokenUrl)
      
      const tokenResponse = await fetch(tokenUrl, {
        headers: {
          'Accept': 'application/json',
        },
      })

      console.log('Token response status:', tokenResponse.status)
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text()
        console.error('Token API Error Response:', errorText)
        throw new Error(`Token API Error: ${tokenResponse.status} - ${errorText}`)
      }

      const tokenData = await tokenResponse.json()
      console.log('Token data from Blockscout:', tokenData)

      // Then, get specific NFT instance details
      const instanceUrl = `${blockscoutUrl}/api/v2/tokens/${address}/instances/${id}`
      console.log('Fetching NFT instance from:', instanceUrl)
      
      const instanceResponse = await fetch(instanceUrl, {
        headers: {
          'Accept': 'application/json',
        },
      })

      console.log('Instance response status:', instanceResponse.status)
      let instanceData = null
      if (instanceResponse.ok) {
        instanceData = await instanceResponse.json()
        console.log('NFT instance data from Blockscout:', instanceData)
      } else {
        const errorText = await instanceResponse.text()
        console.warn('Could not fetch NFT instance data:', instanceResponse.status, errorText)
        
        // If it's a 404, the NFT might not be indexed yet - this is expected for newly minted NFTs
        if (instanceResponse.status === 404) {
          throw new Error('NFT not yet indexed - this is normal for newly minted NFTs')
        } else {
          console.warn('Using token data only due to instance fetch error')
        }
      }

      // Combine the data
      const nftDetails: NFTDetails = {
        tokenId: id,
        contractAddress: address,
        name: instanceData?.metadata?.name || tokenData.name || `${tokenData.symbol || 'Civis'} NFT`,
        description: instanceData?.metadata?.description || tokenData.name || 'Soulbound Civis Proof NFT for verified public contributions on Creditcoin',
        image: instanceData?.metadata?.image || instanceData?.image_url,
        attributes: instanceData?.metadata?.attributes || [],
        metadata: instanceData?.metadata,
      }

      console.log('Final NFT details:', nftDetails)
      return nftDetails
    } catch (error) {
      console.error('Error fetching NFT details:', error)
      throw error
    }
  }, [blockscoutUrl, retryCount])

  const retryFetch = useCallback(() => {
    if (!contractAddress || !tokenId || retryCount >= maxRetries) {
      return
    }

    setRetryCount(prev => prev + 1)
    
    // Exponential backoff: 5s, 10s, 20s, 40s, 80s
    const delayMs = Math.min(5000 * Math.pow(2, retryCount), 80000)
    
    console.log(`Retrying NFT fetch in ${delayMs}ms (attempt ${retryCount + 1}/${maxRetries})`)
    
    retryTimeoutRef.current = setTimeout(() => {
      setIsLoading(true)
      setError(null)
      
      fetchNFTDetails(contractAddress, tokenId)
        .then(details => {
          setNftDetails(details)
          setIsLoading(false)
          setRetryCount(0) // Reset retry count on success
        })
        .catch(err => {
          const errorMessage = err instanceof Error ? err.message : 'Failed to fetch NFT details'
          setError(errorMessage)
          setIsLoading(false)
          
          // Auto-retry if it's an indexing issue and we haven't hit max retries
          if (errorMessage.includes('not yet indexed') && retryCount < maxRetries - 1) {
            console.log('NFT not indexed yet, will retry automatically')
            retryFetch()
          }
        })
    }, delayMs)
  }, [contractAddress, tokenId, retryCount, fetchNFTDetails])

  const manualRefetch = useCallback(() => {
    if (contractAddress && tokenId) {
      setIsLoading(true)
      setError(null)
      setRetryCount(0) // Reset retry count for manual refetch
      
      // Clear any pending retry
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = null
      }
      
      fetchNFTDetails(contractAddress, tokenId)
        .then(details => {
          setNftDetails(details)
          setIsLoading(false)
        })
        .catch(err => {
          const errorMessage = err instanceof Error ? err.message : 'Failed to fetch NFT details'
          setError(errorMessage)
          setIsLoading(false)
          
          // Start auto-retry for newly minted NFTs
          if (errorMessage.includes('not yet indexed')) {
            retryFetch()
          }
        })
    }
  }, [contractAddress, tokenId, fetchNFTDetails, retryFetch])

  useEffect(() => {
    // Clear any pending retries when contract/token changes
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }
    
    if (contractAddress && tokenId) {
      setIsLoading(true)
      setError(null)
      setRetryCount(0)
      
      // For newly minted NFTs, add a small delay before first fetch to allow indexing
      const initialDelay = 2000 // 2 seconds
      
      setTimeout(() => {
        fetchNFTDetails(contractAddress, tokenId)
          .then(details => {
            setNftDetails(details)
            setIsLoading(false)
          })
          .catch(err => {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch NFT details'
            setError(errorMessage)
            setIsLoading(false)
            
            // Start auto-retry for newly minted NFTs
            if (errorMessage.includes('not yet indexed')) {
              retryFetch()
            }
          })
      }, initialDelay)
    } else {
      setNftDetails(null)
      setError(null)
      setIsLoading(false)
      setRetryCount(0)
    }

    // Cleanup timeout on unmount
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = null
      }
    }
  }, [contractAddress, tokenId, fetchNFTDetails, retryFetch])

  return {
    nftDetails,
    isLoading,
    error,
    retryCount,
    maxRetries,
    refetch: manualRefetch
  }
} 