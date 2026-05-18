import { getSupabaseAdmin } from '../_supabaseAdmin.js'
import { sendJson, getStoreId } from './_utils.js'
import { syncDotykackaStock } from './sync.js'

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' })

  const storeId = getStoreId(req)

  try {
    if (storeId) {
      const result = await syncDotykackaStock({ storeId })
      return sendJson(res, 200, { ok: true, store_id: storeId, ...result })
    }

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('pos_settings')
      .select('store_id')
      .eq('pos_provider', 'dotykacka')
      .limit(20)

    if (error) return sendJson(res, 500, { error: 'Server error' })

    const storeIds = Array.isArray(data) ? [...new Set(data.map((x) => x.store_id).filter(Boolean))] : []
    const results = []
    for (const id of storeIds) {
      try {
        const r = await syncDotykackaStock({ storeId: id })
        results.push({ store_id: id, ...r })
      } catch {
        results.push({ store_id: id, error: 'Failed' })
      }
    }
    return sendJson(res, 200, { ok: true, results })
  } catch (error) {
    return sendJson(res, 500, { error: 'Server error' })
  }
}

