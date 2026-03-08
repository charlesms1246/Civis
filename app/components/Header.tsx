'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useAccount } from 'wagmi'
import { useState, useEffect } from 'react'
import { WalletConnect } from './WalletConnect'

export function Header() {
  const { isConnected } = useAccount()
  const [mounted, setMounted] = useState(false)

  // Handle hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Check if wallet is actually connected
  const isWalletConnected = mounted && isConnected

  return (
    <div className="navbar bg-base-100 shadow-sm border-b">
      <div className="navbar-start">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-12 h-12 flex items-center justify-center">
            <Image 
              src="/images/civis-logo.png" 
              alt="Civis Logo" 
              width={48} 
              height={48}
              className="rounded-lg"
            />
          </div>
          <span className="text-xl font-bold civis-gradient">Civis</span>
        </Link>
      </div>
      <div className="navbar-center hidden sm:flex">
        <div className="menu menu-horizontal px-1">
          <Link href="/claim" className="btn btn-ghost btn-sm">
            Claim Proof
          </Link>
          {isWalletConnected && (
            <>
              <Link href="/dashboard" className="btn btn-ghost btn-sm">
                Dashboard
              </Link>
              <Link href="/campaigns" className="btn btn-ghost btn-sm">
                Campaigns
              </Link>
              <Link href="/leaderboard" className="btn btn-ghost btn-sm">
                Leaderboard
              </Link>
            </>
          )}
          <Link href="/shop" className="btn btn-ghost btn-sm">
            Shop
          </Link>
        </div>
      </div>
      <div className="navbar-end">
        <WalletConnect />
      </div>
    </div>
  )
} 