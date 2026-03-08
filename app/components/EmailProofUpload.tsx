'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle, Loader2, Shield, Search, Lock, Cpu, Sparkles } from 'lucide-react'
import { readEMLFile, createEmailProver, EMAIL_DOMAIN_PROVER_ABI, EmailProofResult } from '@/lib/vlayer'
import { PROOF_TYPES, type ProofTypeId } from '@/lib/proof-types'
import React from 'react'

// ── Processing steps shown while the (mock) proof is being generated ──────────
const PROOF_STEPS = [
  { icon: FileText,  label: 'Reading email headers',          detail: 'Parsing MIME structure and metadata',       ms: 600  },
  { icon: Search,    label: 'Extracting DKIM signature',      detail: 'Locating cryptographic signature block',    ms: 900  },
  { icon: Shield,    label: 'Resolving DNS records',          detail: 'Verifying domain public key via DoH',       ms: 1100 },
  { icon: Cpu,       label: 'Generating zero-knowledge proof',detail: 'Running ZK circuit on email commitments',  ms: 2200 },
  { icon: Lock,      label: 'Sealing proof',                  detail: 'Encoding proof for on-chain submission',    ms: 800  },
  { icon: Sparkles,  label: 'Proof ready',                    detail: 'Verification complete',                    ms: 400  },
] as const

interface EmailProofUploadProps {
  proofTypeId?: ProofTypeId
  onProofGenerated: (result: EmailProofResult) => void
  onError: (error: string) => void
  disabled?: boolean
  userAddress?: string
  chainId?: number
}

export function EmailProofUpload({ proofTypeId, onProofGenerated, onError, disabled, userAddress, chainId: chainIdProp }: EmailProofUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState<number>(-1)   // -1 = not started
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Resolve which proof type to use (default: wikipedia for backward compat)
  const effectiveProofTypeId: ProofTypeId = proofTypeId ?? 'wikipedia-donation'

  // Resolve prover address from the correct env var for this proof type
  const PROVER_ADDRESS =
    process.env[PROOF_TYPES[effectiveProofTypeId].proverEnvVar] ||
    '0x0000000000000000000000000000000000000000'
  const CHAIN_ID = chainIdProp ?? parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '102031')
  const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.cc3-testnet.creditcoin.network'

  // Correct ABI for all EmailDomainProver variants — shared interface
  const PROVER_ABI = EMAIL_DOMAIN_PROVER_ABI

  // Debug: Log the configuration on mount
  React.useEffect(() => {
    console.log('=== Email Proof Upload Configuration ===')
    console.log('Proof Type:', effectiveProofTypeId)
    console.log('Chain ID:', CHAIN_ID)
    console.log('RPC URL:', RPC_URL)
    console.log('Prover Address:', PROVER_ADDRESS)
    console.log('=========================================')
  }, [effectiveProofTypeId, CHAIN_ID, RPC_URL, PROVER_ADDRESS])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file: File) => {
    if (file.type !== 'message/rfc822' && !file.name.endsWith('.eml')) {
      onError('Please upload a valid EML file (.eml extension)')
      return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      onError('File size must be less than 10MB')
      return
    }

    setUploadedFile(file)
  }

  const generateProof = async () => {
    if (!uploadedFile) {
      onError('Please upload an EML file first')
      return
    }

    setIsProcessing(true)
    setCurrentStep(0)
    setCompletedSteps([])

    // Run the real proof generation in the background (nearly instant with mock)
    const proofPromise = (async () => {
      const emailContent = await readEMLFile(uploadedFile)
      const prover = await createEmailProver(PROVER_ADDRESS, PROVER_ABI)
      const result = await prover.generateProof(emailContent, CHAIN_ID)
      return { ...result, proofTypeId: effectiveProofTypeId }
    })()

    // Walk through the animated steps; minimum display time per step
    for (let i = 0; i < PROOF_STEPS.length; i++) {
      setCurrentStep(i)
      await new Promise<void>(res => setTimeout(res, PROOF_STEPS[i].ms))
      setCompletedSteps(prev => [...prev, i])
    }

    // Wait for the real work to finish (should already be done)
    try {
      const result = await proofPromise
      // Brief pause on the final "Proof ready" step before advancing
      await new Promise<void>(res => setTimeout(res, 300))
      setIsProcessing(false)
      setCurrentStep(-1)
      setCompletedSteps([])
      onProofGenerated(result)
    } catch (error: any) {
      console.error('Proof generation error:', error)
      setIsProcessing(false)
      setCurrentStep(-1)
      setCompletedSteps([])
      onError(error.message || 'Failed to generate proof')
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-6">

      {/* ── Processing overlay ─────────────────────────────────────────── */}
      {isProcessing && (
        <div className="rounded-xl border border-primary/30 bg-base-100 shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 bg-primary/8 border-b border-primary/20 flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
              <Shield className="absolute inset-0 m-auto h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-base-content">Verifying your contribution</p>
              <p className="text-xs text-base-content/50">Zero-knowledge proof in progress…</p>
            </div>
          </div>

          {/* Steps */}
          <ul className="px-5 py-4 space-y-3">
            {PROOF_STEPS.map((step, i) => {
              const Icon = step.icon
              const isDone    = completedSteps.includes(i)
              const isActive  = currentStep === i && !isDone
              const isPending = currentStep < i

              return (
                <li key={i} className={`flex items-center gap-3 transition-opacity duration-300 ${isPending ? 'opacity-30' : 'opacity-100'}`}>
                  {/* Icon / spinner / tick */}
                  <div className={`flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center border
                    ${isDone    ? 'border-success bg-success/10'
                    : isActive  ? 'border-primary bg-primary/10'
                    : 'border-base-300 bg-base-200'}`}>
                    {isDone ? (
                      <CheckCircle className="h-3.5 w-3.5 text-success" />
                    ) : isActive ? (
                      <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                    ) : (
                      <Icon className="h-3.5 w-3.5 text-base-content/30" />
                    )}
                  </div>

                  {/* Label + detail */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate
                      ${isDone ? 'text-success' : isActive ? 'text-base-content' : 'text-base-content/40'}`}>
                      {step.label}
                    </p>
                    {isActive && (
                      <p className="text-xs text-base-content/50 truncate">{step.detail}</p>
                    )}
                  </div>

                  {/* Timing badge on active step */}
                  {isActive && (
                    <span className="text-xs text-primary/70 font-mono flex-shrink-0">
                      {(step.ms / 1000).toFixed(1)}s
                    </span>
                  )}
                  {isDone && (
                    <span className="text-xs text-success/70 flex-shrink-0">done</span>
                  )}
                </li>
              )
            })}
          </ul>

          {/* Progress bar */}
          <div className="h-1 bg-base-200">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${Math.round(((completedSteps.length) / PROOF_STEPS.length) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Normal upload UI (hidden while processing) ─────────────────── */}
      {!isProcessing && (
        <>
      {/* File Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-primary bg-primary/5'
            : uploadedFile
            ? 'border-success bg-success/5'
            : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={disabled ? undefined : openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".eml,message/rfc822"
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />

        <div className="space-y-4">
          {uploadedFile ? (
            <>
              <CheckCircle className="mx-auto h-12 w-12 text-success" />
              <div>
                <p className="text-lg font-medium text-success">File Ready</p>
                <p className="text-sm text-gray-500 mt-1">{uploadedFile.name}</p>
                <p className="text-xs text-gray-400">
                  {(uploadedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </>
          ) : (
            <>
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Drop your EML file here
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  or click to browse files
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* File Info */}
      {uploadedFile && (
        <div className="bg-base-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <FileText className="h-5 w-5 text-primary mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {uploadedFile.name}
              </p>
              <p className="text-xs text-gray-500">
                Email file ready for verification
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Generate Proof Button */}
      <button
        onClick={generateProof}
        disabled={!uploadedFile || isProcessing || disabled}
        className="btn btn-primary w-full"
      >
        <CheckCircle className="h-4 w-4 mr-2" />
        Generate Email Proof
      </button>

      {/* Helper Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">How to get your EML file:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>For Gmail: Open the email → More (⋮) → Show original → Download original</li>
              <li>For Outlook: Open the email → File → Save As → Choose "Outlook Message Format"</li>
              <li>For Apple Mail: Select email → File → Save As → Choose "Raw Message Source"</li>
            </ul>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  )
} 