'use client'

import { Shield, Calendar, ExternalLink, Eye, Twitter } from 'lucide-react'
import { generateBlockscoutUrls, type NFTMetadata } from '@/lib/civis-contracts'
import Image from 'next/image'
import { useState } from 'react'

interface CivisNFT {
  id: number | string
  title: string
  description: string
  category: string
  civisPoints: number
  dateEarned: string
  imageUrl: string
  verified: boolean
  tokenId?: string
  transactionHash?: string
  isRealNFT?: boolean
  contractAddress?: string
  blockchainVerified?: boolean
}

// Union type to handle both mock NFTs and real NFTs
type NFTData = CivisNFT | NFTMetadata

interface CivisCardProps {
  nft: NFTData
}

function CivisDetailModal({ nft, isOpen, onClose }: { nft: NFTData; isOpen: boolean; onClose: () => void }) {
  const handleViewOnExplorer = () => {
    if (nft.tokenId) {
      const urls = generateBlockscoutUrls(nft.tokenId, nft.transactionHash)
      // Prioritize token instance URL, then transaction, then general token contract
      const targetUrl = urls.tokenInstance || urls.transaction || urls.token
      if (targetUrl) {
        window.open(targetUrl, '_blank')
      }
    } else {
      // Fallback for mock data - open general blockscout
      const baseUrl = process.env.NEXT_PUBLIC_BLOCKSCOUT_API_URL?.replace('/api', '') || 'https://creditcoin-testnet.blockscout.com'
      window.open(baseUrl, '_blank')
    }
  }

  const handleShareOnTwitter = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const text = `Just earned ${nft.civisPoints} CIVIS tokens for "${nft.title}" on @CivisProtocol! 🌟\n\nProving that public contributions make a difference. Join me in building verifiable reputation on Creditcoin! 💫\n\n#Civis #Creditcoin #RWA`

    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(baseUrl)}`
    window.open(twitterUrl, '_blank')
  }

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'donation':
        return 'badge-success'
      case 'volunteering':
        return 'badge-primary'
      case 'environmental':
        return 'badge-accent'
      case 'healthcare':
        return 'badge-error'
      case 'community':
        return 'badge-secondary'
      case 'education':
        return 'badge-warning'
      default:
        return 'badge-primary'
    }
  }

  // Check if this is a real NFT from blockchain
  const isRealNFT = 'isRealNFT' in nft ? nft.isRealNFT : ('blockchainVerified' in nft ? nft.blockchainVerified : false)

  if (!isOpen) return null

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={onClose}>
          ✕
        </button>

        {/* Modal Header */}
        <div className="flex items-start justify-between mb-6 pr-8">
          <div>
            <h3 className="text-2xl font-bold text-neutral mb-2">{nft.title}</h3>
            <div className={`badge ${getCategoryColor(nft.category)}`}>
              {nft.category}
            </div>
          </div>
          {nft.verified && (
            <div className="tooltip" data-tip="Verified contribution">
              <Shield className="w-6 h-6 text-success" />
            </div>
          )}
        </div>

        {/* NFT Image */}
        <div className="w-full h-72 relative overflow-hidden rounded-xl bg-base-200 mb-6 shadow-inner">
          <Image
            src={nft.imageUrl}
            alt={nft.title}
            fill
            className="object-contain"
            sizes="600px"
          />
        </div>

        {/* Description */}
        <div className="mb-6">
          <h4 className="font-semibold text-neutral mb-2">Description</h4>
          <p className="text-neutral/80 leading-relaxed">{nft.description}</p>
        </div>

        {/* Token ID (if available) */}
        {nft.tokenId && (
          <div className="mb-6">
            <h4 className="font-semibold text-neutral mb-2">Token Information</h4>
            <div className="bg-base-200 p-4 rounded-lg font-mono text-sm">
              <span className="text-neutral/60">Token ID:</span> <span className="text-neutral">{nft.tokenId}</span>
              {isRealNFT && 'contractAddress' in nft && nft.contractAddress && (
                <div className="mt-2">
                  <span className="text-neutral/60">Contract:</span> <span className="text-neutral text-xs break-all">{nft.contractAddress}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="text-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4 rounded-xl">
            <div className="text-3xl font-bold civis-gradient mb-1">{nft.civisPoints}</div>
            <div className="text-sm text-neutral/60 font-medium">CIVIS Points</div>
          </div>
          <div className="text-center bg-base-200 p-4 rounded-xl">
            <div className="text-lg font-semibold text-neutral mb-1">{new Date(nft.dateEarned).toLocaleDateString()}</div>
            <div className="text-sm text-neutral/60 font-medium">Date Earned</div>
          </div>
        </div>

        {/* Actions */}
        <div className="modal-action mt-0">
          <button
            onClick={handleShareOnTwitter}
            className="btn btn-info"
          >
            <Twitter className="w-4 h-4" />
            Share on Twitter
          </button>
          <button
            onClick={handleViewOnExplorer}
            className="btn btn-primary"
          >
            <ExternalLink className="w-4 h-4" />
            View on Explorer
          </button>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

export function CivisCard({ nft }: CivisCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'donation':
        return 'badge-success'
      case 'volunteering':
        return 'badge-primary'
      case 'environmental':
        return 'badge-accent'
      case 'healthcare':
        return 'badge-error'
      case 'community':
        return 'badge-secondary'
      case 'education':
        return 'badge-warning'
      default:
        return 'badge-primary'
    }
  }

  // Check if this is a real NFT from blockchain
  const isRealNFT = 'isRealNFT' in nft ? nft.isRealNFT : ('blockchainVerified' in nft ? nft.blockchainVerified : false)

  return (
    <>
      <div
        className={`card bg-base-100 shadow-lg hover:shadow-xl transition-all duration-300 civis-card cursor-pointer transform hover:scale-105 ${isRealNFT ? 'ring-2 ring-success/20' : ''}`}
        onClick={() => setIsModalOpen(true)}
      >
        {/* NFT Image */}
        <figure className="px-6 pt-6">
          <div className="w-full h-56 relative overflow-hidden rounded-lg bg-base-200">
            <Image
              src={nft.imageUrl}
              alt={nft.title}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        </figure>

        <div className="card-body p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="card-title text-base font-semibold text-neutral line-clamp-1">{nft.title}</h3>
              <div className={`badge badge-sm ${getCategoryColor(nft.category)} mt-1`}>
                {nft.category}
              </div>
            </div>
            {nft.verified && (
              <Shield className="w-4 h-4 text-success flex-shrink-0 ml-2" />
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-bold civis-gradient">{nft.civisPoints}</div>
              <div className="text-xs text-neutral/60">CIVIS Points</div>
            </div>
            <div className="flex items-center gap-1 text-xs text-neutral/60">
              <Calendar className="w-3 h-3" />
              {new Date(nft.dateEarned).toLocaleDateString()}
            </div>
          </div>

          {/* Click indicator */}
          <div className="flex items-center justify-center mt-3 text-xs text-neutral/50">
            <Eye className="w-3 h-3 mr-1" />
            Click for details
          </div>
        </div>
      </div>

      <CivisDetailModal
        nft={nft}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
