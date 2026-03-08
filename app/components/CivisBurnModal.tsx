'use client'

import { useState } from 'react'
import { X, Check, ExternalLink, Loader2, Zap } from 'lucide-react'

interface Reward {
  id: string
  name: string
  description: string
  cost: number
  icon: React.ReactNode
  category: 'vouchers' | 'events' | 'crypto' | 'merits'
  available: boolean
  features?: string[]
  externalLink?: string
  discount?: string
  image?: string
}

interface CivisBurnModalProps {
  reward: Reward | null
  civisBalance: string
  isOpen: boolean
  onClose: () => void
  onConfirmBurn: (amount: string) => void
  isRedeeming: boolean
  redeemSuccess: boolean
  civisAmount: string
  setCivisAmount: (amount: string) => void
  burnedAmount: string
}

export function CivisBurnModal({ 
  reward, 
  civisBalance, 
  isOpen, 
  onClose, 
  onConfirmBurn,
  isRedeeming,
  redeemSuccess,
  civisAmount,
  setCivisAmount,
  burnedAmount
}: CivisBurnModalProps) {
  const [inputError, setInputError] = useState<string>('')

  if (!isOpen || !reward) return null

  const maxCivis = Number(civisBalance)
  const enteredAmount = Number(civisAmount)
  const meritsToReceive = enteredAmount * 2
  const isValidAmount = enteredAmount > 0 && enteredAmount <= maxCivis

  const handleAmountChange = (value: string) => {
    setCivisAmount(value)
    setInputError('')
    
    const amount = Number(value)
    if (amount <= 0) {
      setInputError('Amount must be greater than 0')
    } else if (amount > maxCivis) {
      setInputError(`Cannot exceed your balance of ${civisBalance} CIVIS`)
    }
  }

  const handleConfirm = () => {
    if (!isValidAmount) {
      setInputError('Please enter a valid amount')
      return
    }
    onConfirmBurn(civisAmount)
  }

  const handleMaxClick = () => {
    setCivisAmount(civisBalance)
    setInputError('')
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-lg">Burn CIVIS for Merits</h3>
          <button 
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle"
            disabled={isRedeeming}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {redeemSuccess ? (
          // Success State
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-success" />
            </div>
            <h4 className="text-xl font-bold text-success mb-2">CIVIS Burned Successfully!</h4>
            <p className="text-neutral/70 mb-4">
              Your CIVIS tokens have been burned and Merits distributed.
            </p>
            <div className="alert alert-info">
              <Zap className="w-5 h-5" />
              <div className="text-sm">
                {burnedAmount} CIVIS → {Number(burnedAmount) * 2} Blockscout Merits
              </div>
            </div>
          </div>
        ) : (
          // Normal State
          <>
            {/* Reward Info */}
            <div className="flex items-start gap-4 mb-6">
              <div className="relative">
                {reward.image ? (
                  <div className="w-16 h-16 bg-gradient-to-br from-base-200 to-base-300 rounded-lg flex items-center justify-center">
                    <img 
                      src={reward.image} 
                      alt={reward.name}
                      className="h-12 w-12 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        const fallbackDiv = e.currentTarget.nextElementSibling as HTMLElement
                        if (fallbackDiv) {
                          fallbackDiv.classList.remove('hidden')
                        }
                      }}
                    />
                    <div className="p-3 rounded-lg bg-primary/10 text-primary hidden">
                      {reward.icon}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-primary/10 text-primary">
                    {reward.icon}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-lg">{reward.name}</h4>
                <p className="text-neutral/70 text-sm mt-1">{reward.description}</p>
              </div>
            </div>

            {/* Amount Input */}
            <div className="mb-6">
              <label className="label">
                <span className="label-text font-semibold">How much CIVIS to burn?</span>
                <span className="label-text-alt">Balance: {civisBalance} CIVIS</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={civisAmount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="Enter amount"
                  className={`input input-bordered flex-1 ${inputError ? 'input-error' : ''}`}
                  min="0"
                  max={civisBalance}
                  step="0.1"
                  disabled={isRedeeming}
                />
                <button 
                  onClick={handleMaxClick}
                  className="btn btn-outline btn-sm"
                  disabled={isRedeeming}
                >
                  Max
                </button>
              </div>
              {inputError && (
                <label className="label">
                  <span className="label-text-alt text-error">{inputError}</span>
                </label>
              )}
            </div>

            {/* Conversion Preview */}
            {enteredAmount > 0 && (
              <div className="bg-base-200 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">CIVIS to Burn:</span>
                  <span className="font-bold text-warning">{enteredAmount}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">Merits to Receive:</span>
                  <span className="font-bold text-success">{meritsToReceive}</span>
                </div>
                <div className="divider my-2"></div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">After Burn:</span>
                  <span className="font-bold">
                    {Math.max(0, maxCivis - enteredAmount)} CIVIS
                  </span>
                </div>
              </div>
            )}

            {/* Features Preview */}
            {reward.features && (
              <div className="mb-6">
                <h5 className="font-semibold mb-3">Blockscout Merits benefits:</h5>
                <ul className="space-y-2">
                  {reward.features.slice(0, 4).map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-success" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="modal-action">
              <button 
                onClick={onClose}
                className="btn btn-ghost"
                disabled={isRedeeming}
              >
                Cancel
              </button>
              {reward.externalLink && (
                <button 
                  onClick={() => window.open(reward.externalLink, '_blank')}
                  className="btn btn-outline btn-sm"
                  disabled={isRedeeming}
                >
                  <ExternalLink className="w-4 h-4" />
                  Learn More
                </button>
              )}
              <button
                onClick={handleConfirm}
                disabled={!isValidAmount || isRedeeming || !civisAmount}
                className="btn btn-warning"
              >
                {isRedeeming ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Burning CIVIS...
                  </>
                ) : (
                  `Burn ${enteredAmount || 0} CIVIS`
                )}
              </button>
            </div>
          </>
        )}
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  )
}

