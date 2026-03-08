'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export function DebugInfo() {
  const [isVisible, setIsVisible] = useState(false)

  const envVars = {
    'Chain ID': process.env.NEXT_PUBLIC_CHAIN_ID || 'Not set',
    'RPC URL': process.env.NEXT_PUBLIC_RPC_URL || 'Not set',
    'Blockscout URL': process.env.NEXT_PUBLIC_BLOCKSCOUT_URL || 'Not set',
    'NFT Contract': process.env.NEXT_PUBLIC_CIVIS_NFT_CONTRACT || 'Not set',
    'Token Contract': process.env.NEXT_PUBLIC_CIVIS_TOKEN_CONTRACT || 'Not set',
    'Verifier Contract': process.env.NEXT_PUBLIC_CIVIS_VERIFIER_CONTRACT || 'Not set',
    'WalletConnect ID': process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ? 'Set' : 'Not set',
    'Skip Verify (Demo Mode)': process.env.NEXT_PUBLIC_SKIP_VERIFY || 'false',
    'Node Env': process.env.NODE_ENV || 'Not set',
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 btn btn-sm btn-ghost bg-base-200 opacity-50 hover:opacity-100"
        title="Show debug info"
      >
        <Eye className="w-4 h-4" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-base-200 p-4 rounded-lg border shadow-lg max-w-md">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-sm">Debug Info</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="btn btn-xs btn-ghost"
        >
          <EyeOff className="w-3 h-3" />
        </button>
      </div>
      
      <div className="space-y-1 text-xs">
        {Object.entries(envVars).map(([key, value]) => (
          <div key={key} className="flex justify-between">
            <span className="font-medium text-base-content/70">{key}:</span>
            <span className={`font-mono text-right ml-2 break-all max-w-48 ${
              // Highlight demo mode when enabled
              key === 'Skip Verify (Demo Mode)' && value === 'true' 
                ? 'text-warning font-bold' 
                : 'text-primary'
            }`}>
              {value}
            </span>
          </div>
        ))}
      </div>
      
      <div className="mt-3 pt-2 border-t">
        <div className="text-xs text-base-content/60">
          Current URL: {typeof window !== 'undefined' ? window.location.href : 'SSR'}
        </div>
        {process.env.NEXT_PUBLIC_SKIP_VERIFY === 'true' && (
          <div className="mt-2 p-2 bg-warning/10 border border-warning/30 rounded text-xs">
            <div className="text-warning font-semibold">⚠️ Demo Mode Active</div>
            <div className="text-warning/80">
              Email verification and minting on {process.env.NEXT_PUBLIC_CHAIN_ID === '102031' ? 'Creditcoin Testnet' : 'configured chain'}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 