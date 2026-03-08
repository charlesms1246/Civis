import { NextRequest, NextResponse } from 'next/server'

interface CategoryData {
  id: number
  name: string
  description: string
  image: string
  external_url: string
  backgroundColor: string
  attributes_defaults: Array<{ trait_type: string; value: string }>
}

// Civis RWA category map keyed by numeric string ID (0–5)
const NFT_CATEGORIES: Record<string, CategoryData> = {
  '0': {
    id: 0,
    name: 'Donation',
    description: 'A verified charitable donation proof on Creditcoin. This Civis Proof NFT permanently records a real-world financial contribution to a recognised charitable organisation.',
    image: '/nft/civis-donation.png',
    external_url: 'https://civis.example.com/proofs/donation',
    backgroundColor: '10b981',
    attributes_defaults: [
      { trait_type: 'Proof Type', value: 'Email Donation Verification' },
      { trait_type: 'Chain', value: 'Creditcoin Testnet' },
    ],
  },
  '1': {
    id: 1,
    name: 'Volunteering',
    description: 'A verified volunteering activity proof on Creditcoin. This Civis Proof NFT records time and effort contributed to a community or charitable cause.',
    image: '/nft/civis-volunteering.png',
    external_url: 'https://civis.example.com/proofs/volunteering',
    backgroundColor: '3b82f6',
    attributes_defaults: [
      { trait_type: 'Proof Type', value: 'Volunteering Activity Verification' },
      { trait_type: 'Chain', value: 'Creditcoin Testnet' },
    ],
  },
  '2': {
    id: 2,
    name: 'Environmental',
    description: 'A verified environmental contribution proof on Creditcoin. This Civis Proof NFT records a positive ecological action such as a beach cleanup, tree planting, or conservation effort.',
    image: '/nft/civis-environmental.png',
    external_url: 'https://civis.example.com/proofs/environmental',
    backgroundColor: '06b6d4',
    attributes_defaults: [
      { trait_type: 'Proof Type', value: 'Environmental Action Verification' },
      { trait_type: 'Chain', value: 'Creditcoin Testnet' },
    ],
  },
  '3': {
    id: 3,
    name: 'Education',
    description: 'A verified educational contribution proof on Creditcoin. This Civis Proof NFT records a meaningful contribution to open knowledge or learning.',
    image: '/nft/civis-education.png',
    external_url: 'https://civis.example.com/proofs/education',
    backgroundColor: 'f59e0b',
    attributes_defaults: [
      { trait_type: 'Proof Type', value: 'Education Contribution Verification' },
      { trait_type: 'Chain', value: 'Creditcoin Testnet' },
    ],
  },
  '4': {
    id: 4,
    name: 'Healthcare',
    description: 'A verified healthcare contribution proof on Creditcoin. This Civis Proof NFT records a blood donation, medical volunteering, or healthcare support action.',
    image: '/nft/civis-healthcare.png',
    external_url: 'https://civis.example.com/proofs/healthcare',
    backgroundColor: 'ef4444',
    attributes_defaults: [
      { trait_type: 'Proof Type', value: 'Healthcare Contribution Verification' },
      { trait_type: 'Chain', value: 'Creditcoin Testnet' },
    ],
  },
  '5': {
    id: 5,
    name: 'Community',
    description: 'A verified community contribution proof on Creditcoin. This Civis Proof NFT records an action that strengthened a local or digital community.',
    image: '/nft/civis-community.png',
    external_url: 'https://civis.example.com/proofs/community',
    backgroundColor: 'a855f7',
    attributes_defaults: [
      { trait_type: 'Proof Type', value: 'Community Contribution Verification' },
      { trait_type: 'Chain', value: 'Creditcoin Testnet' },
    ],
  },
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    const actionValue = searchParams.get('actionValue') ?? undefined
    const tokenId = searchParams.get('tokenId') ?? undefined

    // Validate required parameter
    if (!categoryId) {
      return NextResponse.json(
        { error: 'categoryId parameter is required' },
        { status: 400 }
      )
    }

    // Validate category exists
    if (!NFT_CATEGORIES[categoryId]) {
      return NextResponse.json(
        { error: `Invalid categoryId. Valid values are: ${Object.keys(NFT_CATEGORIES).join(', ')}` },
        { status: 400 }
      )
    }

    const categoryData = NFT_CATEGORIES[categoryId]
    const origin = new URL(request.url).origin

    const nftMetadata = {
      name: `Civis Proof — ${categoryData.name}${actionValue ? `: ${actionValue}` : ''}`,
      description: categoryData.description,
      image: `${origin}${categoryData.image}`,
      external_url: tokenId
        ? `https://creditcoin-testnet.blockscout.com/token/${process.env.NEXT_PUBLIC_CIVIS_NFT_CONTRACT}/instance/${tokenId}`
        : categoryData.external_url,
      attributes: [
        ...categoryData.attributes_defaults,
        ...(actionValue ? [{ trait_type: 'Action Value', value: actionValue }] : []),
        { trait_type: 'Category', value: categoryData.name },
        { trait_type: 'Rarity', value: getCivisRarity(actionValue) },
      ],
      background_color: categoryData.backgroundColor,
      animation_url: null,
      youtube_url: null,
    }

    return NextResponse.json(nftMetadata, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('Error generating NFT metadata:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Determine rarity from optional action value string (e.g. donation amount)
function getCivisRarity(actionValue?: string): string {
  if (!actionValue) return 'Standard'
  const amount = parseFloat(actionValue)
  if (isNaN(amount)) return 'Standard'
  if (amount >= 1000) return 'Legendary'
  if (amount >= 500) return 'Epic'
  if (amount >= 100) return 'Rare'
  if (amount >= 25) return 'Uncommon'
  return 'Common'
}
