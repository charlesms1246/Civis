'use client'

import { useAccount } from 'wagmi'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CivisCard } from './CivisCard'
import { Sparkles, Plus, Award, Trophy, Star, Target, Loader2 } from 'lucide-react'
import { getCivisTokenBalance, getUserCivisNFTs, type NFTMetadata } from '@/lib/civis-contracts'

// Mock data for development - using Civis RWA taxonomy
const mockCivisProofs = [
  {
    id: 1,
    title: 'Wikipedia Donation Proof',
    description: 'Verified $25 donation to Wikimedia Foundation — supporting free knowledge globally.',
    category: 'Donation',
    civisPoints: 20,
    dateEarned: '2026-02-14',
    imageUrl: '/nft/wiki.png',
    verified: true,
  },
  {
    id: 2,
    title: 'Red Cross Donation Proof',
    description: 'Verified $50 donation to American Red Cross — humanitarian aid on-chain.',
    category: 'Donation',
    civisPoints: 20,
    dateEarned: '2026-02-20',
    imageUrl: '/nft/redcross.png',
    verified: true,
  },
  {
    id: 3,
    title: 'Doctors Without Borders Proof',
    description: 'Verified €30 donation to MSF — global medical aid, permanently recorded.',
    category: 'Donation',
    civisPoints: 20,
    dateEarned: '2026-03-01',
    imageUrl: '/nft/msf.png',
    verified: true,
  },
]

const supportedProjects = [
  { name: 'Wikipedia Donation', icon: '📚', description: 'Verify a donation to Wikimedia Foundation', category: 'Donation', route: '/claim/wikipedia-donation' },
  { name: 'Red Cross Donation', icon: '🩸', description: 'Verify a donation to the American Red Cross', category: 'Donation', route: '/claim/red-cross-donation' },
  { name: 'Doctors Without Borders', icon: '🏥', description: 'Verify a donation to MSF/Doctors Without Borders', category: 'Donation', route: '/claim/msf-donation' },
]

export function Dashboard() {
  const { address, isConnected } = useAccount()
  
  // State for real data
  const [civisBalance, setCivisBalance] = useState<string>('0')
  const [isLoadingCivis, setIsLoadingCivis] = useState(false)
  const [userNFTs, setUserNFTs] = useState<any[]>([])
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Get user address from wagmi
  const userAddress = isConnected && address ? address : ''

  // Mock data calculations
  const totalMockKarma = mockCivisProofs.reduce((sum, nft) => sum + nft.civisPoints, 0)
  const totalRealCivis = Number(civisBalance)
  const totalCivis = totalMockKarma + totalRealCivis
  const totalNFTs = mockCivisProofs.length + userNFTs.length

  // Handle hydration
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Load data when wallet connects/disconnects
  useEffect(() => {
    if (isConnected && address) {
      loadCivisBalance(address)
      loadUserNFTs(address)
    } else {
      setCivisBalance('0')
      setUserNFTs([])
    }
  }, [isConnected, address])

  // Load CIVIS token balance from blockchain
  const loadCivisBalance = async (address: string) => {
    setIsLoadingCivis(true)
    try {
      const balance = await getCivisTokenBalance(address)
      setCivisBalance(balance)
      console.log('Loaded CIVIS balance:', balance)
    } catch (error) {
      console.error('Error loading CIVIS balance:', error)
      setCivisBalance('0')
    } finally {
      setIsLoadingCivis(false)
    }
  }

  // Load user's NFTs from blockchain (updated implementation)
  const loadUserNFTs = async (address: string) => {
    setIsLoadingNFTs(true)
    try {
      const nfts = await getUserCivisNFTs(address)
      setUserNFTs(nfts)
      console.log('Loaded user NFTs:', nfts)
    } catch (error) {
      console.error('Error loading user NFTs:', error)
      setUserNFTs([])
    } finally {
      setIsLoadingNFTs(false)
    }
  }

  // Don't render until mounted to avoid hydration issues
  if (!isMounted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card bg-base-100 shadow">
                <div className="h-40 bg-gray-200 rounded-t-2xl"></div>
                <div className="card-body p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral">
              Welcome back! 👋
            </h1>
            <p className="text-neutral/70 mt-1">
              Your impact grows with every public contribution
            </p>
          </div>
          <div className="stats shadow">
            <div className="stat">
              <div className="stat-figure text-primary">
                <Trophy className="w-8 h-8" />
              </div>
              <div className="stat-title">Total CIVIS</div>
              <div className="stat-value text-primary civis-gradient">
                {isLoadingCivis ? (
                  <span className="loading loading-spinner loading-md"></span>
                ) : (
                  totalCivis
                )}
              </div>
              <div className="stat-desc">
                {isConnected && userAddress ? (
                  <>
                    {Number(civisBalance) > 0 && (
                      <span className="text-success">🪙 {civisBalance} tokens</span>
                    )}
                    {Number(civisBalance) > 0 && mockCivisProofs.length > 0 && ' • '}
                    {mockCivisProofs.length > 0 && (
                      <span className="text-neutral/70">📚 {totalMockKarma} examples</span>
                    )}
                  </>
                ) : (
                  `From ${totalNFTs} public contributions`
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <div className="flex items-center gap-4 flex-wrap">
          <Link href="/claim" className="btn btn-primary btn-lg">
            <Plus className="w-5 h-5" />
            Claim New Proof
          </Link>
          <Link href="/campaigns" className="btn btn-outline">
            <Target className="w-5 h-5" />
            View Challenges
          </Link>
          <Link href="/shop" className="btn btn-outline">
            <Award className="w-5 h-5" />
            Redeem CIVIS
          </Link>
          <Link href="/leaderboard" className="btn btn-outline">
            <Trophy className="w-5 h-5" />
            View Leaderboard
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Civis Proofs */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
            <h2 className="text-2xl font-bold text-neutral">Your Civis Proofs</h2>
              <p className="text-sm text-neutral/60 mt-1">Soulbound NFTs earned through verified real-world contributions</p>
            </div>
            <div className="badge badge-primary badge-lg">
              <Star className="w-4 h-4 mr-1" />
              {totalNFTs} NFTs
            </div>
          </div>

          {totalNFTs > 0 ? (
            <div className="space-y-6">
              {/* Real User NFTs */}
              {userNFTs.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-lg font-semibold text-primary">Your Minted NFTs</h3>
                    {isLoadingNFTs && <Loader2 className="w-4 h-4 animate-spin" />}
                    <div className="badge badge-success badge-sm">✅ Verified On-Chain</div>
                  </div>
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {userNFTs.map((nft) => (
                      <CivisCard key={nft.id} nft={nft} />
                    ))}
                  </div>
                </div>
              )}

              {/* Mock/Example Civis Proofs */}
              {mockCivisProofs.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-lg font-semibold text-neutral/70">Example Civis Proofs</h3>
                    <div className="badge badge-secondary badge-sm">📚 Examples</div>
                  </div>
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {mockCivisProofs.map((nft) => (
                      <CivisCard key={nft.id} nft={nft} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body items-center text-center py-16">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <Sparkles className="w-12 h-12 text-primary" />
                </div>
                <h3 className="card-title text-neutral mb-2">No Civis Proofs Yet</h3>
                <p className="text-neutral/70 mb-6">
                  Start your journey by submitting your first real-world contribution proof.
                </p>
                <Link href="/claim" className="btn btn-primary">
                  <Plus className="w-5 h-5" />
                  Submit Your First Proof
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Supported Projects */}
        <div>
          <h3 className="text-xl font-bold text-neutral mb-6">Supported Projects</h3>
          <div className="space-y-4">
            {supportedProjects.map((project, index) => (
              <Link key={index} href={project.route} className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                <div className="card-body p-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{project.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-neutral">{project.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="badge badge-secondary badge-sm">{project.category}</div>
                        <span className="text-sm text-neutral/70">
                          {project.description}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="card bg-gradient-to-br from-primary/10 to-secondary/10 shadow-lg mt-6">
            <div className="card-body">
              <h4 className="font-semibold text-neutral mb-4">Your Impact</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-neutral/70">Real NFTs</span>
                  <span className="font-semibold text-success">
                    {userNFTs.length}
                    {isLoadingNFTs && <Loader2 className="w-3 h-3 ml-1 animate-spin inline" />}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral/70">Example Proofs</span>
                  <span className="font-semibold text-neutral/70">{mockCivisProofs.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral/70">CIVIS Tokens</span>
                  <span className="font-semibold text-primary">
                    {isLoadingCivis ? (
                      <Loader2 className="w-3 h-3 animate-spin inline" />
                    ) : (
                      civisBalance
                    )}
                  </span>
                </div>
                {isConnected && userAddress && (
                  <div className="flex justify-between">
                    <span className="text-neutral/70">Status</span>
                    <span className="font-semibold text-success">
                      {Number(civisBalance) > 0 ? '✅ Active' : '🔗 Connected'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
