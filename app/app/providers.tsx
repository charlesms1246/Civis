'use client'

import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { WagmiProvider } from 'wagmi'
import { NotificationProvider, TransactionPopupProvider } from '@blockscout/app-sdk'
import { config } from '../lib/wagmi'
import { TransactionPopupListener } from '../components/TransactionPopupListener'

// Blockscout wrapper component
function BlockscoutProviders({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  try {
    return (
      <NotificationProvider>
        <TransactionPopupProvider>
          {isMounted && <TransactionPopupListener />}
          {children}
        </TransactionPopupProvider>
      </NotificationProvider>
    )
  } catch (error) {
    console.error('Error rendering Blockscout providers:', error)
    return <>{children}</>
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <BlockscoutProviders>
            {children}
          </BlockscoutProviders>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
} 