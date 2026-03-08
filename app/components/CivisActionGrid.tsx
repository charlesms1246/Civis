'use client'

import { useState } from 'react'
import Link from 'next/link'

interface CivisAction {
  id: string
  name: string
  description: string
  category: string
  categoryId: number
  status: 'active' | 'coming-soon'
  emoji: string
  civisReward: string
  route?: string
}

const CIVIS_ACTIONS: CivisAction[] = [
  {
    id: 'wikipedia-donation',
    name: 'Wikipedia Donation',
    description: 'Prove your donation to the Wikimedia Foundation. Support free knowledge and earn permanent on-chain credit for your contribution.',
    category: 'Donation',
    categoryId: 0,
    status: 'active',
    emoji: '📚',
    civisReward: '20 CIVIS',
    route: '/claim/wikipedia-donation',
  },
  {
    id: 'red-cross-donation',
    name: 'Red Cross Donation',
    description: 'Prove your donation to the American Red Cross. Humanitarian aid verified on-chain as a permanent real-world asset proof.',
    category: 'Donation',
    categoryId: 0,
    status: 'active',
    emoji: '🩸',
    civisReward: '20 CIVIS',
    route: '/claim/red-cross-donation',
  },
  {
    id: 'msf-donation',
    name: 'Doctors Without Borders',
    description: 'Prove your donation to Médecins Sans Frontières. Global medical aid contributions recorded permanently on Creditcoin.',
    category: 'Donation',
    categoryId: 0,
    status: 'active',
    emoji: '🏥',
    civisReward: '20 CIVIS',
    route: '/claim/msf-donation',
  },
  {
    id: 'beach-cleanup',
    name: 'Beach Cleanup',
    description: 'Prove participation in a certified coastal or waterway cleanup event. Environmental stewardship made visible and verifiable on-chain.',
    category: 'Environmental',
    categoryId: 2,
    status: 'coming-soon',
    emoji: '🌊',
    civisReward: '20 CIVIS',
  },
  {
    id: 'volunteer-shift',
    name: 'Community Volunteer',
    description: 'Prove verified volunteer hours at a registered non-profit or community organisation. Time invested in others, verified forever.',
    category: 'Volunteering',
    categoryId: 1,
    status: 'coming-soon',
    emoji: '🤝',
    civisReward: '20 CIVIS',
  },
  {
    id: 'blood-donation',
    name: 'Blood Donation',
    description: 'Prove a certified blood or platelet donation at a registered healthcare facility. Life-saving contributions, permanently on-chain.',
    category: 'Healthcare',
    categoryId: 4,
    status: 'coming-soon',
    emoji: '🩺',
    civisReward: '20 CIVIS',
  },
]

const FILTER_OPTIONS = [
  'All',
  'Available Now',
  'Donation',
  'Volunteering',
  'Environmental',
  'Healthcare',
] as const

type FilterOption = (typeof FILTER_OPTIONS)[number]

const categoryColors: Record<string, string> = {
  Donation: 'badge-success',
  Volunteering: 'badge-primary',
  Environmental: 'badge-accent',
  Education: 'badge-warning',
  Healthcare: 'badge-error',
  Community: 'badge-secondary',
}

function ActionCard({ action }: { action: CivisAction }) {
  const badgeColor = categoryColors[action.category] ?? 'badge-neutral'
  const isActive = action.status === 'active'

  const cardInner = (
    <div
      className={`card bg-base-100 shadow-lg h-full transition-all duration-200 ${
        isActive
          ? 'hover:shadow-2xl hover:-translate-y-1 border border-transparent hover:border-primary/30 cursor-pointer'
          : 'opacity-60 cursor-not-allowed'
      }`}
    >
      <div className="card-body gap-3">
        {/* Top row: emoji + coming-soon badge */}
        <div className="flex items-start justify-between">
          <div className="text-5xl leading-none">{action.emoji}</div>
          {!isActive && (
            <span className="badge badge-ghost badge-sm shrink-0">Coming Soon</span>
          )}
        </div>

        {/* Title */}
        <h3 className="card-title text-lg leading-tight">{action.name}</h3>

        {/* Description */}
        <p className="text-sm text-base-content/70 leading-snug flex-1">{action.description}</p>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <span className={`badge badge-sm ${badgeColor}`}>{action.category}</span>
          <span className="badge badge-sm badge-outline">email proof</span>
        </div>

        <div className="divider my-0"></div>

        {/* Reward row + action button */}
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs">
            <span className="text-base-content/60">Reward: </span>
            <span className="font-bold text-primary">{action.civisReward}</span>
            <span className="text-base-content/60"> + Soulbound NFT</span>
          </div>
          {isActive ? (
            <span className="btn btn-primary btn-xs shrink-0">Start Proof</span>
          ) : (
            <button disabled className="btn btn-disabled btn-xs shrink-0">
              Coming Soon
            </button>
          )}
        </div>
      </div>
    </div>
  )

  if (isActive && action.route) {
    return (
      <Link href={action.route} className="block h-full">
        {cardInner}
      </Link>
    )
  }

  return <div className="h-full">{cardInner}</div>
}

export function CivisActionGrid() {
  const [activeFilter, setActiveFilter] = useState<FilterOption>('All')

  const filtered = CIVIS_ACTIONS.filter((action) => {
    if (activeFilter === 'All') return true
    if (activeFilter === 'Available Now') return action.status === 'active'
    return action.category === activeFilter
  })

  return (
    <div className="space-y-8">
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 justify-center">
        {FILTER_OPTIONS.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`btn btn-sm ${activeFilter === filter ? 'btn-primary' : 'btn-ghost'}`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((action) => (
          <ActionCard key={action.id} action={action} />
        ))}
      </div>

      {/* Suggest a Contribution Type */}
      <div className="card bg-base-200 border border-base-300 shadow-sm">
        <div className="card-body items-center text-center py-8">
          <div className="text-4xl mb-2">💡</div>
          <h3 className="card-title text-xl">Suggest a Contribution Type</h3>
          <p className="text-base-content/70 max-w-md">
            Know of a public contribution that deserves on-chain recognition? Help us expand the Civis proof registry.
          </p>
          <div className="card-actions mt-4">
            <a
              href="mailto:civis@creditcoin.network?subject=Contribution%20Type%20Suggestion"
              className="btn btn-outline btn-sm"
            >
              Suggest →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
