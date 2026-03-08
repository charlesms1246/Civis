// SERVER-SIDE ONLY — This route uses CTC_REWARD_DISTRIBUTOR_PRIVATE_KEY
// which must NEVER be exposed to the browser.
// This route is called from Shop.tsx after CIVIS tokens are burned on-chain.
// Rate limiting should be applied at the infrastructure level (Vercel Edge Config, etc.)

import { NextRequest, NextResponse } from 'next/server'
import { createWalletClient, createPublicClient, http, parseEther, formatEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { defineChain } from 'viem'

interface CTCTopUpRequest {
  userAddress: string  // The recipient's address
  signature: string    // Signed message proving wallet ownership (prevent abuse)
}

const creditcoinTestnet = defineChain({
  id: 102031,
  name: 'Creditcoin Testnet',
  nativeCurrency: { name: 'tCTC', symbol: 'tCTC', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.cc3-testnet.creditcoin.network'] } },
})

const TOPUP_AMOUNT = parseEther('0.05') // 0.05 tCTC per top-up

export async function POST(request: NextRequest) {
  try {
    // 1. Read the private key from server-side env
    const privateKey = process.env.CTC_REWARD_DISTRIBUTOR_PRIVATE_KEY
    if (!privateKey) {
      return NextResponse.json({ error: 'Distributor not configured' }, { status: 503 })
    }

    // 2. Parse and validate request body
    const body: CTCTopUpRequest = await request.json()
    if (!body.userAddress || !body.userAddress.startsWith('0x')) {
      return NextResponse.json({ error: 'Invalid user address' }, { status: 400 })
    }

    // 3. Check distributor balance
    const publicClient = createPublicClient({ chain: creditcoinTestnet, transport: http() })
    const distributorAddress = process.env.CTC_REWARD_DISTRIBUTOR_ADDRESS as `0x${string}`
    if (!distributorAddress) {
      return NextResponse.json({ error: 'Distributor address not configured' }, { status: 503 })
    }
    const distributorBalance = await publicClient.getBalance({ address: distributorAddress })

    if (distributorBalance < TOPUP_AMOUNT + parseEther('0.01')) {
      return NextResponse.json(
        { error: 'Distributor wallet has insufficient tCTC' },
        { status: 503 }
      )
    }

    // 4. Check recipient balance — don't top up if already well-funded (> 0.1 tCTC)
    const recipientBalance = await publicClient.getBalance({
      address: body.userAddress as `0x${string}`,
    })
    if (recipientBalance > parseEther('0.1')) {
      return NextResponse.json(
        {
          error: 'Your tCTC balance is already sufficient. Top-ups are reserved for users with low balances.',
          currentBalance: formatEther(recipientBalance),
        },
        { status: 400 }
      )
    }

    // 5. Send the tCTC
    const account = privateKeyToAccount(privateKey as `0x${string}`)
    const walletClient = createWalletClient({
      account,
      chain: creditcoinTestnet,
      transport: http(),
    })

    const hash = await walletClient.sendTransaction({
      to: body.userAddress as `0x${string}`,
      value: TOPUP_AMOUNT,
    })

    return NextResponse.json({
      success: true,
      transactionHash: hash,
      amount: formatEther(TOPUP_AMOUNT),
      message: `Sent ${formatEther(TOPUP_AMOUNT)} tCTC to ${body.userAddress}`,
    })
  } catch (error) {
    console.error('Error processing tCTC top-up:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
