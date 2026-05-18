import { getSupabaseAdmin } from '../_supabaseAdmin.js'
import { getPosSettings } from './_posSettings.js'

function toNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function normalizeItems(items) {
  if (!Array.isArray(items)) return []
  return items
    .map((x) => (x && typeof x === 'object' ? x : null))
    .filter(Boolean)
}

async function updateLastSync(supabase, id) {
  await supabase.from('pos_settings').update({ last_sync_time: new Date().toISOString() }).eq('id', id)
}

async function updateProductsByField(supabase, field, updates) {
  const results = []
  for (const u of updates) {
    const matchValue = u.matchValue
    if (!matchValue) continue
    const patch = u.patch
    const { error } = await supabase.from('products').update(patch).eq(field, matchValue)
    if (error) throw new Error('Product update failed')
    results.push({ field, matchValue })
  }
  return results
}

export async function syncStock({ storeId, provider, matchField, items }) {
  const supabase = getSupabaseAdmin()
  const settings = await getPosSettings({ storeId, provider })

  const normalized = normalizeItems(items)
  const updates = normalized
    .map((x) => {
      const qty =
        toNumber(x.current_stock) ??
        toNumber(x.currentStock) ??
        toNumber(x.quantity) ??
        toNumber(x.stan) ??
        toNumber(x.stock_quantity)
      const price = toNumber(x.price) ?? toNumber(x.cena)
      const matchValue =
        x[matchField] ??
        (matchField === 'sku' ? x.item_sku || x.sku : null) ??
        (matchField === 'external_pos_id' ? x.product_id || x.external_pos_id : null) ??
        (matchField === 'ean' ? x.ean || x.code : null)

      if (qty == null) return null

      const stock_quantity = Math.max(0, Math.trunc(qty))
      const patch = {
        stock_quantity,
        is_available: stock_quantity > 0,
        ...(price != null ? { price } : {}),
      }
      return { matchValue: String(matchValue || '').trim(), patch }
    })
    .filter(Boolean)

  const updated = await updateProductsByField(supabase, matchField, updates)
  await updateLastSync(supabase, settings.id)

  return { updated: updated.length }
}

export async function syncDotykackaStock({ storeId }) {
  const supabase = getSupabaseAdmin()
  const settings = await getPosSettings({ storeId, provider: 'dotykacka' })
  if (!settings.api_token || !settings.warehouse_id) throw new Error('Dotykačka settings incomplete')

  const url = `https://api.dotykacka.pl/v2/warehouses/${encodeURIComponent(settings.warehouse_id)}/stocks`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${settings.api_token}` },
  })
  if (!res.ok) throw new Error('Dotykačka request failed')
  const data = await res.json()
  const items = Array.isArray(data) ? data : data?.data || []

  const normalized = normalizeItems(items)
    .map((x) => ({
      external_pos_id: x.id != null ? String(x.id) : null,
      quantity: x.quantity,
      price: x.price,
    }))
    .filter((x) => x.external_pos_id)

  const result = await syncStock({
    storeId,
    provider: 'dotykacka',
    matchField: 'external_pos_id',
    items: normalized,
  })

  return result
}
