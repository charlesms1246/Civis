'use client'

import { useState } from 'react'
import { X, Check, ExternalLink, Loader2 } from 'lucide-react'

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

interface RedemptionModalProps {
  reward: Reward | null
  userCivis: number
  isOpen: boolean
  onClose: () => void
  onConfirmRedeem: (reward: Reward) => void
}

export function RedemptionModal({ 
  reward, 
  userCivis, 
  isOpen, 
  onClose, 
  onConfirmRedeem 
}: RedemptionModalProps) {
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [redeemSuccess, setRedeemSuccess] = useState(false)

  if (!isOpen || !reward) return null

  const handleConfirm = async () => {
    setIsRedeeming(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setIsRedeeming(false)
    setRedeemSuccess(true)
    
    // Call parent handler
    onConfirmRedeem(reward)
    
    // Auto close after success
    setTimeout(() => {
      setRedeemSuccess(false)
      onClose()
    }, 3000)
  }

  const canAfford = userCivis >= reward.cost

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-lg">Redeem Reward</h3>
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
            <h4 className="text-xl font-bold text-success mb-2">Redemption Successful!</h4>
            <p className="text-neutral/70 mb-4">
              Your {reward.name} has been processed successfully.
            </p>
            {reward.id === 'blockscout-merits' && (
              <div className="alert alert-info">
                <div className="text-sm">
                  {reward.cost * 2} Blockscout Merits have been added to your account.
                </div>
              </div>
            )}
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
                        // Fallback to icon if image fails to load
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

            {/* Cost Breakdown */}
            <div className="bg-base-200 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">Cost:</span>
                <span className="font-bold civis-gradient text-lg">{reward.cost} CIVIS</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">Your Balance:</span>
                <span className={`font-semibold ${canAfford ? 'text-success' : 'text-error'}`}>
                  {userCivis} CIVIS
                </span>
              </div>
              <div className="divider my-2"></div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">After Purchase:</span>
                <span className="font-bold">
                  {canAfford ? userCivis - reward.cost : userCivis} CIVIS
                </span>
              </div>
            </div>

            {/* Features Preview */}
            {reward.features && (
              <div className="mb-6">
                <h5 className="font-semibold mb-3">What you get:</h5>
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

            {/* Warning for insufficient funds */}
            {!canAfford && (
              <div className="alert alert-error mb-6">
                <div className="text-sm">
                  You need {reward.cost - userCivis} more CIVIS tokens to redeem this reward.
                </div>
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
                disabled={!canAfford || isRedeeming}
                className="btn btn-primary"
              >
                {isRedeeming ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Redeem for ${reward.cost} CIVIS`
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