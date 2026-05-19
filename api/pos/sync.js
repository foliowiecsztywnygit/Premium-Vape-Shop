import { getPosSettings } from './_posSettings.js'
import { getPrisma } from '../../server/prisma.js'

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

async function updateLastSync(id) {
  const prisma = getPrisma()
  await prisma.posSetting.update({
    where: { id },
    data: { lastSyncAt: new Date() },
  })
}

function mapMatchField(field) {
  if (field === 'external_pos_id') return 'externalPosId'
  if (field === 'stock_quantity') return 'stockQuantity'
  return field
}

async function updateProductsByField(prisma, field, updates) {
  const results = []
  const prismaField = mapMatchField(field)
  for (const u of updates) {
    const matchValue = u.matchValue
    if (!matchValue) continue
    const patch = u.patch
    await prisma.product.updateMany({
      where: { [prismaField]: matchValue },
      data: patch,
    })
    results.push({ field: prismaField, matchValue })
  }
  return results
}

export async function syncStock({ storeId, provider, matchField, items }) {
  const prisma = getPrisma()
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
        stockQuantity: stock_quantity,
        isAvailable: stock_quantity > 0,
        ...(price != null ? { basePrice: price } : {}),
      }
      return { matchValue: String(matchValue || '').trim(), patch }
    })
    .filter(Boolean)

  const updated = await updateProductsByField(prisma, matchField, updates)
  await updateLastSync(settings.id)

  return { updated: updated.length }
}

export async function syncDotykackaStock({ storeId }) {
  const settings = await getPosSettings({ storeId, provider: 'dotykacka' })
  if (!settings.apiToken || !settings.warehouseId) throw new Error('Dotykačka settings incomplete')

  const url = `https://api.dotykacka.pl/v2/warehouses/${encodeURIComponent(settings.warehouseId)}/stocks`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${settings.apiToken}` },
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
