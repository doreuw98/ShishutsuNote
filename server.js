import { createServer } from 'node:http'
import { createReadStream, existsSync, readFileSync } from 'node:fs'
import { extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { handleRatesRequest } from './server/rates-handler.mjs'

const root = fileURLToPath(new URL('.', import.meta.url))
const dist = resolve(root, 'dist')
const mimeTypes = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ico': 'image/x-icon',
  '.webp': 'image/webp', '.woff2': 'font/woff2', '.json': 'application/json; charset=utf-8',
}

function loadLocalEnv() {
  if (process.env.OPEN_EXCHANGE_RATES_APP_ID) return process.env.OPEN_EXCHANGE_RATES_APP_ID.trim()
  try {
    const source = readFileSync(new URL('.env.local', import.meta.url), 'utf8')
    const line = source.split(/\r?\n/).find((row) => /^\s*OPEN_EXCHANGE_RATES_APP_ID\s*=/.test(row))
    return line?.slice(line.indexOf('=') + 1).trim().replace(/^['"]|['"]$/g, '') || undefined
  } catch {
    return undefined
  }
}

const appId = loadLocalEnv()

createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', 'http://localhost')
  if (url.pathname === '/api/rates') {
    await handleRatesRequest(request, response, appId)
    return
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }); response.end(); return
  }
  let pathname
  try { pathname = decodeURIComponent(url.pathname) } catch { response.writeHead(400); response.end('Bad request'); return }
  const requested = pathname.replace(/^\/+/, '') || 'index.html'
  const file = resolve(dist, requested)
  if (file !== dist && !file.startsWith(dist + sep)) {
    response.writeHead(400); response.end('Bad request'); return
  }
  const target = existsSync(file) ? file : resolve(dist, 'index.html')
  if (!existsSync(target)) { response.writeHead(503); response.end('Run npm run build first'); return }
  response.writeHead(200, {
    'Content-Type': mimeTypes[extname(target)] ?? 'application/octet-stream',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  })
  if (request.method === 'HEAD') { response.end(); return }
  createReadStream(target).pipe(response)
}).listen(Number(process.env.PORT) || 4173, '127.0.0.1', () => {
  console.log(`ShishutsuNote is available at http://localhost:${Number(process.env.PORT) || 4173}`)
})
