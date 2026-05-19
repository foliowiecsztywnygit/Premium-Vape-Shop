import crypto from 'crypto'

export async function readRawBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body
  if (req.rawBody && Buffer.isBuffer(req.rawBody)) return req.rawBody
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return Buffer.concat(chunks)
}

export async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body
  const raw = await readRawBody(req)
  if (!raw?.length) return null
  return JSON.parse(raw.toString('utf8'))
}

export function sendJson(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

export function getStoreId(req) {
  const fromQuery = req.query?.store_id || req.query?.storeId
  if (typeof fromQuery === 'string' && fromQuery.trim()) return fromQuery.trim()
  const fromHeader = req.headers['x-store-id']
  if (typeof fromHeader === 'string' && fromHeader.trim()) return fromHeader.trim()
  return null
}

export function timingSafeEqualHex(aHex, bHex) {
  try {
    const a = Buffer.from(String(aHex || ''), 'hex')
    const b = Buffer.from(String(bHex || ''), 'hex')
    if (a.length !== b.length) return false
    return crypto.timingSafeEqual(a, b)
  } catch {
    return false
  }
}
