// Single source of truth for all supported proof types and their configuration.

export type ProofTypeId = 'wikipedia-donation' | 'red-cross-donation' | 'msf-donation'

export interface ProofTypeConfig {
  id: ProofTypeId
  // Display
  name: string
  description: string
  icon: string
  categoryId: number  // Maps to CivisNFT category: 0=Donation, 1=Volunteering, etc.
  category: string    // Human-readable category name
  // Instructions
  donateUrl: string
  donateInstructions: string
  emailDomain: string
  emailInstructions: string
  // Vlayer prover artifact path (relative to app/lib — used by loadProverArtifact in vlayer.ts)
  proverArtifactPath: string
  // Env var for prover contract address (used as vlayer prover address in SDK config)
  proverEnvVar: string
  // UI
  civisReward: string  // e.g. "20 CIVIS"
  nftEmoji: string
  twitterCopy: string  // Action-specific share text
}

export const PROOF_TYPES: Record<ProofTypeId, ProofTypeConfig> = {
  'wikipedia-donation': {
    id: 'wikipedia-donation',
    name: 'Wikipedia Donation',
    description: 'Support free knowledge by donating to Wikimedia Foundation',
    icon: '📚',
    categoryId: 0,
    category: 'Donation',
    donateUrl: 'https://donate.wikimedia.org',
    donateInstructions: 'Donate any amount to Wikipedia at donate.wikimedia.org. Make sure to use your email address so you receive a confirmation email.',
    emailDomain: 'wikimedia.org',
    emailInstructions: 'After donating, you will receive a confirmation email from wikimedia.org. Download it as an .eml file and upload it here.',
    proverArtifactPath: '../../contracts/out/WikipediaProver.sol/WikipediaProver.json',
    proverEnvVar: 'NEXT_PUBLIC_CIVIS_WIKIPEDIA_PROVER',
    civisReward: '20 CIVIS',
    nftEmoji: '📚',
    twitterCopy: 'Just proved my Wikipedia donation on @CivisProtocol and earned 20 CIVIS tokens! Supporting free knowledge on-chain. #Civis #Creditcoin #PublicGood',
  },
  'red-cross-donation': {
    id: 'red-cross-donation',
    name: 'Red Cross Donation',
    description: 'Support humanitarian aid by donating to the American Red Cross',
    icon: '🩸',
    categoryId: 0,
    category: 'Donation',
    donateUrl: 'https://www.redcross.org/donate',
    donateInstructions: 'Donate to the American Red Cross at redcross.org/donate. Ensure you provide your email address to receive a confirmation.',
    emailDomain: 'redcross.org',
    emailInstructions: 'After donating, you will receive a donation confirmation email from redcross.org. Download it as an .eml file and upload it here.',
    proverArtifactPath: '../../contracts/out/RedCrossProver.sol/RedCrossProver.json',
    proverEnvVar: 'NEXT_PUBLIC_CIVIS_REDCROSS_PROVER',
    civisReward: '20 CIVIS',
    nftEmoji: '🩸',
    twitterCopy: 'Just proved my Red Cross donation on @CivisProtocol and earned 20 CIVIS tokens! Humanitarian aid, verified on-chain. #Civis #Creditcoin #RWA',
  },
  'msf-donation': {
    id: 'msf-donation',
    name: "Doctors Without Borders Donation",
    description: "Support global medical aid by donating to Médecins Sans Frontières",
    icon: '🏥',
    categoryId: 0,
    category: 'Donation',
    donateUrl: 'https://www.msf.org/donate',
    donateInstructions: 'Donate to Médecins Sans Frontières (MSF/Doctors Without Borders) at msf.org/donate. Ensure you provide your email to receive a confirmation.',
    emailDomain: 'msf.org',
    emailInstructions: 'After donating, you will receive a donation receipt email from msf.org. Download it as an .eml file and upload it here.',
    proverArtifactPath: '../../contracts/out/MSFProver.sol/MSFProver.json',
    proverEnvVar: 'NEXT_PUBLIC_CIVIS_MSF_PROVER',
    civisReward: '20 CIVIS',
    nftEmoji: '🏥',
    twitterCopy: 'Just proved my MSF donation on @CivisProtocol and earned 20 CIVIS tokens! Global medical aid, verified on-chain. #Civis #Creditcoin #DoctorsWithoutBorders',
  },
}

export function getProofType(id: ProofTypeId): ProofTypeConfig {
  return PROOF_TYPES[id]
}
