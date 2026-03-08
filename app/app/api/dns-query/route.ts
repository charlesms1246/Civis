/**
 * DNS-over-HTTPS proxy for vlayer preverifyEmail.
 *
 * preverifyEmail (run in the browser) needs to resolve DKIM TXT records via a
 * DoH endpoint.  Hitting an external DoH server directly from the browser fails
 * with a CORS error.  This route lives on the same origin as the Next.js app so
 * it has no CORS restriction; it forwards the request to Cloudflare's public DoH
 * resolver and relays the response back to the client.
 *
 * The vlayer SDK appends "/dns-query" to the configured dnsServiceUrl, so this
 * file is at /api/dns-query to match that path exactly.
 */

import { NextRequest, NextResponse } from 'next/server'

const UPSTREAM_DOH = 'https://cloudflare-dns.com/dns-query'

function buildUpstreamUrl(incoming: URL): string {
  const target = new URL(UPSTREAM_DOH)
  // Forward all query parameters as-is (e.g. ?dns=... or ?name=...&type=...)
  incoming.searchParams.forEach((value, key) => {
    target.searchParams.set(key, value)
  })
  return target.toString()
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const upstreamUrl = buildUpstreamUrl(request.nextUrl)

    const upstreamResponse = await fetch(upstreamUrl, {
      method: 'GET',
      headers: {
        Accept:
          request.headers.get('Accept') ?? 'application/dns-message',
      },
    })

    const body = await upstreamResponse.arrayBuffer()

    return new NextResponse(body, {
      status: upstreamResponse.status,
      headers: {
        'Content-Type':
          upstreamResponse.headers.get('Content-Type') ??
          'application/dns-message',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err: any) {
    console.error('[dns-query proxy] GET error:', err)
    return NextResponse.json(
      { error: 'DNS proxy upstream error', detail: err?.message },
      { status: 502 }
    )
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.arrayBuffer()

    const upstreamResponse = await fetch(UPSTREAM_DOH, {
      method: 'POST',
      headers: {
        'Content-Type':
          request.headers.get('Content-Type') ?? 'application/dns-message',
        Accept:
          request.headers.get('Accept') ?? 'application/dns-message',
      },
      body,
    })

    const responseBody = await upstreamResponse.arrayBuffer()

    return new NextResponse(responseBody, {
      status: upstreamResponse.status,
      headers: {
        'Content-Type':
          upstreamResponse.headers.get('Content-Type') ??
          'application/dns-message',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err: any) {
    console.error('[dns-query proxy] POST error:', err)
    return NextResponse.json(
      { error: 'DNS proxy upstream error', detail: err?.message },
      { status: 502 }
    )
  }
}
