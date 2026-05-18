import { getPosSettings } from './_posSettings.js'
import { readJson, sendJson, getStoreId } from './_utils.js'
import { syncStock } from './sync.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' })

  const storeId = getStoreId(req)
  if (!storeId) return sendJson(res, 400, { error: 'store_id is required' })

  try {
    const settings = await getPosSettings({ storeId, provider: 'subiekt' })
    if (!settings.webhook_secret) return sendJson(res, 500, { error: 'POS settings not configured' })

    const secret = req.headers['x-subiekt-secret'] || req.headers['x-webhook-secret']
    if (typeof secret !== 'string' || secret !== settings.webhook_secret) {
      return sendJson(res, 401, { error: 'Unauthorized' })
    }

    const body = await readJson(req)
    const items = Array.isArray(body) ? body : body?.items
    if (!Array.isArray(items)) return sendJson(res, 400, { error: 'Invalid payload' })

    const byEan = items
      .filter((x) => x?.ean)
      .map((x) => ({ ean: x.ean, stan: x.stan, cena: x.cena }))

    const byCode = items
      .filter((x) => !x?.ean && x?.code)
      .map((x) => ({ sku: x.code, stan: x.stan, cena: x.cena }))

    const r1 = byEan.length
      ? await syncStock({ storeId, provider: 'subiekt', matchField: 'ean', items: byEan })
      : { updated: 0 }
    const r2 = byCode.length
      ? await syncStock({ storeId, provider: 'subiekt', matchField: 'sku', items: byCode })
      : { updated: 0 }

    return sendJson(res, 200, { ok: true, updated: r1.updated + r2.updated })
  } catch (error) {
    return sendJson(res, 500, { error: 'Server error' })
  }
}

