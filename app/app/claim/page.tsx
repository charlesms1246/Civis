import type { Metadata } from 'next'
import { Suspense } from 'react'
import { CivisActionGrid } from '@/components/CivisActionGrid'

export const metadata: Metadata = {
  title: 'Claim Contribution Proof | Civis',
  description: 'Prove your real-world public contributions on Creditcoin. Upload your email receipt, generate a zero-knowledge proof, and earn soulbound CIVIS tokens.',
}

export default function ClaimPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
              Claim Your Contribution Proof
            </h1>
            <p className="text-lg text-base-content/80 max-w-2xl mx-auto">
              Choose a verified public contribution to prove on Creditcoin. Upload your email receipt, generate a zero-knowledge proof, and earn soulbound CIVIS tokens and a permanent on-chain proof NFT.
            </p>
          </div>

          {/* Action Grid */}
          <Suspense fallback={
            <div className="flex justify-center items-center py-20">
              <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
          }>
            <CivisActionGrid />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
