import crypto from 'crypto'
import { getPosSettings } from './_posSettings.js'
import { readRawBody, sendJson, getStoreId, timingSafeEqualHex } from './_utils.js'
import { syncStock } from './sync.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' })

  const storeId = getStoreId(req)
  if (!storeId) return sendJson(res, 400, { error: 'store_id is required' })

  try {
    const settings = await getPosSettings({ storeId, provider: 'gopos' })
    if (!settings.webhook_secret) return sendJson(res, 500, { error: 'POS settings not configured' })

    const signatureHeader = req.headers['x-gopos-signature']
    if (typeof signatureHeader !== 'string' || !signatureHeader.trim()) {
      return sendJson(res, 401, { error: 'Unauthorized' })
    }

    const raw = await readRawBody(req)
    const expected = crypto.createHmac('sha256', settings.webhook_secret).update(raw).digest('hex')
    const provided = signatureHeader.replace(/^sha256=/i, '').trim()
    if (!timingSafeEqualHex(provided, expected)) return sendJson(res, 401, { error: 'Unauthorized' })

    const body = JSON.parse(raw.toString('utf8') || '{}')
    const eventType = body?.type || body?.event || body?.name
    if (eventType && String(eventType) !== 'stock.updated') return sendJson(res, 200, { ok: true, ignored: true })

    const items = Array.isArray(body?.items) ? body.items : Array.isArray(body) ? body : []
    const result = await syncStock({
      storeId,
      provider: 'gopos',
      matchField: 'external_pos_id',
      items: items.map((x) => ({
        external_pos_id: x?.product_id ?? x?.external_pos_id,
        quantity: x?.quantity ?? x?.stock_quantity,
      })),
    })

    return sendJson(res, 200, { ok: true, ...result })
  } catch (error) {
    return sendJson(res, 500, { error: 'Server error' })
  }
}

