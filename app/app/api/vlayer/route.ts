/**
 * vlayer prover proxy — root endpoint.
 *
 * The vlayer SDK (v_call, v_getProofReceipt) sends JSON-RPC 2.0 POST requests
 * directly to the bare proverUrl with no path suffix, e.g. POST /api/vlayer.
 * This route proxies those requests to the real upstream prover so the browser
 * never makes a cross-origin request (CORS).
 */

import { NextRequest, NextResponse } from 'next/server'

const UPSTREAM =
  (process.env.VLAYER_PROVER_UPSTREAM ||
    'https://stable-fake-prover.vlayer.xyz').replace(/\/$/, '')

async function proxyToUpstream(request: NextRequest): Promise<NextResponse> {
  try {
    const forwardHeaders: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      if (key !== 'host' && key !== 'connection') {
        forwardHeaders[key] = value
      }
    })

    const body =
      request.method !== 'GET' && request.method !== 'HEAD'
        ? await request.arrayBuffer()
        : undefined

    const upstreamResponse = await fetch(UPSTREAM, {
      method: request.method,
      headers: forwardHeaders,
      body,
    })

    const responseBody = await upstreamResponse.arrayBuffer()

    const responseHeaders = new Headers()
    upstreamResponse.headers.forEach((value, key) => {
      if (!['transfer-encoding', 'connection'].includes(key)) {
        responseHeaders.set(key, value)
      }
    })
    responseHeaders.set('Access-Control-Allow-Origin', '*')
    responseHeaders.set('Access-Control-Allow-Methods', '*')
    responseHeaders.set('Access-Control-Allow-Headers', '*')

    return new NextResponse(responseBody, {
      status: upstreamResponse.status,
      headers: responseHeaders,
    })
  } catch (err: any) {
    console.error('[vlayer root proxy] error:', err)
    return NextResponse.json(
      { error: 'vlayer proxy error', detail: err?.message },
      { status: 502 }
    )
  }
}

export const GET = proxyToUpstream
export const POST = proxyToUpstream

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  })
}
