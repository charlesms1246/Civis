/**
 * vlayer prover proxy.
 *
 * The vlayer SDK (v_call → prove) calls the prover URL directly from the
 * browser.  That is a cross-origin request and stable-fake-prover.vlayer.xyz
 * does not send permissive CORS headers, so the browser blocks it with
 * "Failed to fetch".
 *
 * This catch-all route forwards any request that the SDK sends under
 * /api/vlayer/... to the real upstream prover, then relays the response back.
 * Because the proxy lives on the same origin as the Next.js app there are no
 * browser CORS restrictions.
 *
 * Set VLAYER_PROVER_UPSTREAM (server-side only) to override the upstream.
 * The default is the vlayer stable-fake-prover test endpoint.
 */

import { NextRequest, NextResponse } from 'next/server'

const UPSTREAM_BASE =
  (process.env.VLAYER_PROVER_UPSTREAM ||
    'https://stable-fake-prover.vlayer.xyz').replace(/\/$/, '')

async function proxyRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  try {
    const { path } = await params
    const upstreamPath = path.join('/')

    // Preserve query string
    const searchString = request.nextUrl.search
    const upstreamUrl = `${UPSTREAM_BASE}/${upstreamPath}${searchString}`

    // Forward headers (strip host so the upstream doesn't reject the request)
    const forwardHeaders: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      if (key !== 'host' && key !== 'connection') {
        forwardHeaders[key] = value
      }
    })

    // Read body for methods that carry one
    const bodyMethods = ['POST', 'PUT', 'PATCH']
    const body = bodyMethods.includes(request.method)
      ? await request.arrayBuffer()
      : undefined

    const upstreamResponse = await fetch(upstreamUrl, {
      method: request.method,
      headers: forwardHeaders,
      body,
    })

    const responseBody = await upstreamResponse.arrayBuffer()

    // Build response headers, adding permissive CORS so the SDK can read them
    const responseHeaders = new Headers()
    upstreamResponse.headers.forEach((value, key) => {
      // Skip headers that conflict with NextResponse
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
    console.error('[vlayer proxy] error:', err)
    return NextResponse.json(
      { error: 'vlayer proxy upstream error', detail: err?.message },
      { status: 502 }
    )
  }
}

export const GET = proxyRequest
export const POST = proxyRequest
export const PUT = proxyRequest
export const PATCH = proxyRequest
export const DELETE = proxyRequest

// Handle preflight CORS requests
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  })
}
