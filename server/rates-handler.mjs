const RATE_URL = 'https://openexchangerates.org/api/latest.json?symbols=JPY,IDR'

export async function handleRatesRequest(request, response, appId) {
  if (request.method !== 'GET') {
    response.writeHead(405, { 'Content-Type': 'application/json; charset=utf-8', Allow: 'GET' })
    response.end(JSON.stringify({ error: 'method_not_allowed' }))
    return
  }
  if (!appId) {
    response.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
    response.end(JSON.stringify({ error: 'rates_not_configured' }))
    return
  }

  try {
    const upstreamUrl = new URL(RATE_URL)
    upstreamUrl.searchParams.set('app_id', appId)
    const upstream = await fetch(upstreamUrl, { signal: AbortSignal.timeout(10_000) })
    if (!upstream.ok) {
      response.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
      response.end(JSON.stringify({ error: 'rates_upstream_unavailable' }))
      return
    }
    const payload = await upstream.json()
    const jpy = payload?.rates?.JPY
    const idr = payload?.rates?.IDR
    const timestamp = payload?.timestamp
    if (payload?.base !== 'USD' || !Number.isFinite(timestamp) || !Number.isFinite(jpy) || !Number.isFinite(idr) || jpy <= 0 || idr <= 0) {
      response.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
      response.end(JSON.stringify({ error: 'rates_invalid_response' }))
      return
    }
    response.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'private, max-age=300',
      'X-Content-Type-Options': 'nosniff',
    })
    response.end(JSON.stringify({ base: 'USD', timestamp, rates: { JPY: jpy, IDR: idr } }))
  } catch (error) {
    const timedOut = error?.name === 'TimeoutError' || error?.name === 'AbortError'
    response.writeHead(timedOut ? 504 : 502, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
    response.end(JSON.stringify({ error: timedOut ? 'rates_upstream_timeout' : 'rates_upstream_unavailable' }))
  }
}
