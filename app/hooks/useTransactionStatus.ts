import { useState, useEffect, useRef } from 'react'

export interface TransactionStatus {
  status: 'pending' | 'success' | 'error' | 'not_found'
  confirmations?: number
  gasUsed?: string
  gasPrice?: string
  blockNumber?: number
  error?: string
  revertReason?: string
}

export function useTransactionStatus(txHash: string | null, chainId: string) {
  const [status, setStatus] = useState<TransactionStatus>({ status: 'pending' })
  const [isPolling, setIsPolling] = useState(false)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const blockscoutUrl = process.env.NEXT_PUBLIC_BLOCKSCOUT_URL || 'https://creditcoin-testnet.blockscout.com'

  const fetchTransactionStatus = async (hash: string): Promise<TransactionStatus> => {
    try {
      console.log('Fetching transaction status for:', hash)
      
      const response = await fetch(`${blockscoutUrl}/api/v2/transactions/${hash}`, {
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          return { status: 'not_found' }
        }
        throw new Error(`API Error: ${response.status}`)
      }

      const data = await response.json()
      console.log('Transaction data from Blockscout:', data)

      // Parse transaction status from Blockscout response
      if (data.status === 'ok') {
        return {
          status: 'success',
          confirmations: data.confirmations || 0,
          gasUsed: data.gas_used,
          gasPrice: data.gas_price,
          blockNumber: data.block,
        }
      } else if (data.status === 'error') {
        return {
          status: 'error',
          error: data.error || 'Transaction failed',
          revertReason: data.revert_reason,
        }
      } else {
        // Transaction exists but is still pending
        return {
          status: 'pending',
          confirmations: data.confirmations || 0,
        }
      }
    } catch (error) {
      console.error('Error fetching transaction status:', error)
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  const startPolling = (hash: string) => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
    }

    console.log('Starting transaction polling for:', hash)
    setIsPolling(true)

    // Poll every 7 seconds — Creditcoin ~6s block time
    pollIntervalRef.current = setInterval(async () => {
      const newStatus = await fetchTransactionStatus(hash)
      setStatus(newStatus)

      // Stop polling when transaction is confirmed or failed
      if (newStatus.status === 'success' || newStatus.status === 'error') {
        console.log('Transaction final status:', newStatus.status)
        setIsPolling(false)
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }
      }
    }, 7000)

    // Initial fetch
    fetchTransactionStatus(hash).then(setStatus)
  }

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
    setIsPolling(false)
  }

  useEffect(() => {
    if (txHash && chainId) {
      startPolling(txHash)
    } else {
      stopPolling()
    }

    return () => stopPolling()
  }, [txHash, chainId])

  return {
    status,
    isPolling,
    startPolling,
    stopPolling,
  }
} 