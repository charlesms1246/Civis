'use client'

import { useAccount } from 'wagmi'
import { WalletConnect } from '../components/WalletConnect'
import { Dashboard } from '../components/Dashboard'
import { Hero } from '../components/Hero'

export default function Home() {
  const { isConnected, status } = useAccount()

  if (status === 'connecting' || status === 'reconnecting') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    )
  }

  if (!isConnected) {
    return <Hero />
  }

  return <Dashboard />
} 