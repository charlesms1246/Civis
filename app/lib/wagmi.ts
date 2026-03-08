import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { http } from 'viem'
import { defineChain } from 'viem'

// Define Creditcoin Testnet chain
export const creditcoinTestnet = defineChain({
  id: 102031,
  name: 'Creditcoin Testnet',
  nativeCurrency: {
    name: 'Testnet CTC',
    symbol: 'tCTC',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.cc3-testnet.creditcoin.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: 'https://creditcoin-testnet.blockscout.com',
    },
  },
  testnet: true,
})

// Define Anvil local chain
export const anvilLocal = defineChain({
  id: 31337,
  name: 'Anvil Local',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
  },
  testnet: true,
})

export const config = getDefaultConfig({
  appName: 'Civis',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'civis-demo',
  chains: [creditcoinTestnet, anvilLocal],
  transports: {
    [creditcoinTestnet.id]: http('https://rpc.cc3-testnet.creditcoin.network'),
    [anvilLocal.id]: http('http://127.0.0.1:8545'),
  },
  ssr: true,
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
} 