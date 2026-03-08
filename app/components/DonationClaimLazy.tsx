'use client'

import dynamic from 'next/dynamic'
import type { ProofTypeId } from '@/lib/proof-types'

const DonationClaimDynamic = dynamic(
  () => import('./DonationClaim').then((mod) => ({ default: mod.DonationClaim })),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center items-center py-20">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    ),
  }
)

export function DonationClaimLazy({ proofTypeId }: { proofTypeId: ProofTypeId }) {
  return <DonationClaimDynamic proofTypeId={proofTypeId} />
}
