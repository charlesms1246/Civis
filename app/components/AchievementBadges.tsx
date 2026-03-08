'use client'

import { Crown, Star, Shield, Flame, Heart, Code, Leaf, HandHeart } from 'lucide-react'

interface Badge {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  category: string
  earnedAt?: string
}

interface AchievementBadgesProps {
  badges: string[]
  showDetails?: boolean
}

const badgeDefinitions: { [key: string]: Badge } = {
  'Early Adopter': {
    id: 'early-adopter',
    name: 'Early Adopter',
    description: 'Among the first 100 users',
    icon: <Crown className="w-4 h-4" />,
    rarity: 'legendary',
    category: 'Special'
  },
  'Generous Giver': {
    id: 'generous-giver',
    name: 'Generous Giver',
    description: 'Made over 10 donations',
    icon: <Heart className="w-4 h-4" />,
    rarity: 'epic',
    category: 'Gift'
  },
  'Tech Contributor': {
    id: 'tech-contributor',
    name: 'Tech Contributor',
    description: 'Contributed to 5+ open source projects',
    icon: <Code className="w-4 h-4" />,
    rarity: 'rare',
    category: 'Knowledge'
  },
  'Life Saver': {
    id: 'life-saver',
    name: 'Life Saver',
    description: 'Donated blood 3+ times',
    icon: <Shield className="w-4 h-4" />,
    rarity: 'epic',
    category: 'Care'
  },
  'Knowledge Educator': {
    id: 'educator',
    name: 'Knowledge Educator',
    description: 'Verified educational contributions',
    icon: <Star className="w-4 h-4" />,
    rarity: 'common',
    category: 'Knowledge'
  },
  'Eco Warrior': {
    id: 'eco-warrior',
    name: 'Eco Warrior',
    description: 'Environmental impact verified',
    icon: <Leaf className="w-4 h-4" />,
    rarity: 'rare',
    category: 'Ecology'
  },
  'Green Champion': {
    id: 'green-champion',
    name: 'Green Champion',
    description: 'Planted 100+ trees or equivalent',
    icon: <Leaf className="w-4 h-4" />,
    rarity: 'epic',
    category: 'Ecology'
  },
  'Code Ninja': {
    id: 'code-ninja',
    name: 'Code Ninja',
    description: 'Exceptional coding contributions',
    icon: <Code className="w-4 h-4" />,
    rarity: 'common',
    category: 'Knowledge'
  },
  'Dev Mentor': {
    id: 'dev-mentor',
    name: 'Dev Mentor',
    description: 'Mentored 10+ developers',
    icon: <HandHeart className="w-4 h-4" />,
    rarity: 'rare',
    category: 'Knowledge'
  },
  'Health Advocate': {
    id: 'health-advocate',
    name: 'Health Advocate',
    description: 'Health-related volunteer work',
    icon: <Heart className="w-4 h-4" />,
    rarity: 'rare',
    category: 'Care'
  },
  'Wellness Champion': {
    id: 'wellness-champion',
    name: 'Wellness Champion',
    description: 'Promoted community wellness',
    icon: <Heart className="w-4 h-4" />,
    rarity: 'rare',
    category: 'Care'
  },
  'Civis Legend': {
    id: 'civis-legend',
    name: 'Civis Legend',
    description: 'Earned over 10,000 CIVIS tokens',
    icon: <Crown className="w-4 h-4" />,
    rarity: 'legendary',
    category: 'Special'
  }
}

const rarityColors = {
  'common': 'badge-info',
  'rare': 'badge-primary',
  'epic': 'badge-secondary',
  'legendary': 'badge-warning'
}

export function AchievementBadges({ badges, showDetails = false }: AchievementBadgesProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {badges.map((badgeName) => {
        const badge = badgeDefinitions[badgeName]
        if (!badge) return null

        return (
          <div
            key={badge.id}
            className={`badge ${rarityColors[badge.rarity]} gap-1 ${showDetails ? 'tooltip' : ''}`}
            data-tip={showDetails ? badge.description : undefined}
          >
            {badge.icon}
            <span className="text-xs">{badge.name}</span>
          </div>
        )
      })}
    </div>
  )
} 