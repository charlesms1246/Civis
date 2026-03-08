import '@rainbow-me/rainbowkit/styles.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { DebugInfo } from '../components/DebugInfo'
import { Header } from '../components/Header'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Civis — Real-World Contribution Proofs on Creditcoin',
  description: 'Earn soulbound Civis Proof NFTs for verified real-world contributions — donations, volunteering, healthcare, education, and more. Built on Creditcoin.',
  keywords: ['NFT', 'Civis', 'Soulbound', 'RWA', 'Creditcoin', 'Donation', 'Volunteering', 'Reputation', 'Web3', 'Real-World Assets'],
  authors: [{ name: 'Civis Team' }],
  openGraph: {
    title: 'Civis — Real-World Contribution Proofs on Creditcoin',
    description: 'Turn your real-world contributions into permanent on-chain proof. Earn soulbound Civis NFTs and CIVIS tokens on Creditcoin.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-theme="civis">
      <body className={`${inter.className} min-h-screen bg-base-100`}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              {children}
            </main>
          </div>
          {process.env.NODE_ENV === 'development' && <DebugInfo />}
        </Providers>
      </body>
    </html>
  )
} 