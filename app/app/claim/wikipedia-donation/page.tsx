import type { Metadata } from 'next'
import { Suspense } from 'react'
import { DonationClaimLazy } from '../../../components/DonationClaimLazy'

export const metadata: Metadata = {
  title: 'Prove Wikipedia Donation | Civis',
  description: 'Verify your Wikipedia donation with a zero-knowledge email proof and earn CIVIS tokens on Creditcoin.',
}

const spinner = (
  <div className="flex justify-center items-center py-20">
    <span className="loading loading-spinner loading-lg text-primary"></span>
  </div>
)

export default function WikipediaDonationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Suspense fallback={spinner}>
            <DonationClaimLazy proofTypeId="wikipedia-donation" />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
