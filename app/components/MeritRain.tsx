'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface MeritRainProps {
  isActive: boolean
  duration?: number
  onComplete?: () => void
}

interface FallingMerit {
  id: number
  x: number
  delay: number
  duration: number
  size: number
  rotation: number
}

export function MeritRain({ isActive, duration = 8000, onComplete }: MeritRainProps) {
  const [merits, setMerits] = useState<FallingMerit[]>([])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isActive) {
      setIsVisible(true)
      generateMerits()
      
      // Auto cleanup after duration
      const timer = setTimeout(() => {
        setIsVisible(false)
        setMerits([])
        onComplete?.()
      }, duration)
      
      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
      setMerits([])
    }
  }, [isActive, duration, onComplete])

  const generateMerits = () => {
    const newMerits: FallingMerit[] = []
    const meritCount = 20 // Good balance of effect without overwhelming
    
    for (let i = 0; i < meritCount; i++) {
      newMerits.push({
        id: i,
        x: Math.random() * 90 + 5, // 5-95% to keep away from edges
        delay: Math.random() * 1500, // 0-1.5 second delay
        duration: 3000 + Math.random() * 2000, // 3-5 seconds fall time
        size: 35 + Math.random() * 25, // 35-60px size
        rotation: Math.random() * 360,
      })
    }
    
    setMerits(newMerits)
  }

  if (!isVisible) return null

  return (
    <div 
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 50, // High but reasonable z-index
        overflow: 'hidden',
      }}
    >
      {merits.map((merit) => (
        <div
          key={merit.id}
          style={{
            position: 'absolute',
            left: `${merit.x}%`,
            top: '-60px',
            width: `${merit.size}px`,
            height: `${merit.size}px`,
            animation: `merit-fall ${merit.duration}ms ${merit.delay}ms ease-in forwards`,
            transform: `rotate(${merit.rotation}deg)`,
          }}
        >
          <div className="relative w-full h-full drop-shadow-lg">
            <Image
              src="/images/logo-merit.png"
              alt="Merit"
              fill
              className="object-contain"
              unoptimized={true}
            />
          </div>
        </div>
      ))}
      
      <style jsx>{`
        @keyframes merit-fall {
          from {
            transform: translateY(-60px) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          to {
            transform: translateY(calc(100vh + 60px)) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
} 