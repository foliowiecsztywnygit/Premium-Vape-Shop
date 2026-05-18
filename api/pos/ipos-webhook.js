import { getPosSettings } from './_posSettings.js'
import { readJson, sendJson, getStoreId } from './_utils.js'
import { syncStock } from './sync.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' })

  const storeId = getStoreId(req)
  if (!storeId) return sendJson(res, 400, { error: 'store_id is required' })

  try {
    const settings = await getPosSettings({ storeId, provider: 'ipos' })
    if (settings.webhook_secret) {
      const secret = req.headers['x-ipos-secret'] || req.headers['x-webhook-secret']
      if (typeof secret !== 'string' || secret !== settings.webhook_secret) {
        return sendJson(res, 401, { error: 'Unauthorized' })
      }
    }

    const body = await readJson(req)
    const items = Array.isArray(body) ? body : body?.items
    if (!Array.isArray(items)) return sendJson(res, 400, { error: 'Invalid payload' })

    const result = await syncStock({
      storeId,
      provider: 'ipos',
      matchField: 'sku',
      items: items.map((x) => ({
        sku: x?.item_sku ?? x?.sku,
        current_stock: x?.current_stock,
      })),
    })

    return sendJson(res, 200, { ok: true, ...result })
  } catch (error) {
    return sendJson(res, 500, { error: 'Server error' })
  }
}

