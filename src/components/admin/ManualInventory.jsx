import React, { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../../api/client'

function toInt(value) {
  const n = Number(String(value).replace(',', '.'))
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.trunc(n))
}

export default function ManualInventory() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')

  const load = async () => {
    const token = localStorage.getItem('pvs-admin-token')
    if (!token) {
      setItems([])
      setLoading(false)
      setError('Brak tokenu admina. Zaloguj się w panelu.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await apiFetch('/api/admin/inventory', {
        headers: { 'x-admin-token': token },
      })
      const list = Array.isArray(data?.products) ? data.products : []
      setItems(list)
      setLoading(false)
    } catch (e) {
      setError('Błąd ładowania produktów')
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((p) => {
      const parts = [p.name, p.sku, p.ean, p.external_pos_id].filter(Boolean).map((x) => String(x).toLowerCase())
      return parts.some((x) => x.includes(q))
    })
  }, [items, query])

  const update = async (id, patch) => {
    const token = localStorage.getItem('pvs-admin-token')
    if (!token) return
    setError('')
    try {
      const res = await apiFetch(`/api/admin/inventory/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify(patch),
      })
      const next = res?.product
      if (next?.id) setItems((prev) => prev.map((x) => (x.id === id ? next : x)))
    } catch {
      setError('Nie udało się zapisać zmian')
    }
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-accent-cyan text-xs font-semibold tracking-[0.22em] uppercase">Fallback</p>
          <h2 className="mt-2 text-xl font-black tracking-tight">Manual Inventory</h2>
        </div>
        <div className="grid grid-cols-1 sm:flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szukaj po nazwie / SKU / EAN"
            className="h-11 w-full sm:w-80 px-4 rounded-2xl border border-black/10 focus:outline-none focus:border-accent-cyan"
          />
          <button
            type="button"
            onClick={load}
            className="h-11 w-full sm:w-auto px-4 rounded-2xl border border-black/10 text-[12px] tracking-[0.18em] uppercase font-semibold hover:border-accent-cyan/60 hover:text-accent-cyan transition-colors"
          >
            Odśwież
          </button>
        </div>
      </div>

      {error && <div className="mt-4 text-sm text-rose-600 font-semibold">{error}</div>}

      <div className="mt-6 text-sm text-black/60">
        {loading ? 'Ładowanie…' : `Produkty: ${filtered.length}`}
      </div>

      <div className="mt-4 grid gap-3">
        {filtered.map((p) => (
          <div key={p.id} className="rounded-2xl border border-black/5 px-4 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold truncate">{p.name || '(bez nazwy)'}</div>
                <div className="text-xs tracking-[0.18em] uppercase text-black/50 break-words">
                  {p.sku ? `SKU: ${p.sku}` : ''} {p.ean ? ` • EAN: ${p.ean}` : ''}{' '}
                  {p.externalPosId ? ` • POS: ${p.externalPosId}` : ''}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[160px_160px] gap-2 sm:items-center">
                <label className="h-11 rounded-2xl border border-black/10 bg-white px-3 inline-flex items-center justify-between">
                  <span className="text-xs tracking-[0.18em] uppercase text-black/50">Qty</span>
                  <input
                    defaultValue={p.stockQuantity ?? 0}
                    inputMode="numeric"
                    className="w-20 text-right font-semibold outline-none"
                    onBlur={(e) => {
                      const stockQuantity = toInt(e.target.value)
                      update(p.id, { stockQuantity, isAvailable: stockQuantity > 0 })
                    }}
                  />
                </label>

                <button
                  type="button"
                  onClick={() => update(p.id, { isAvailable: !p.isAvailable })}
                  className={`h-11 w-full rounded-2xl text-[12px] tracking-[0.18em] uppercase font-semibold transition-colors ${
                    p.isAvailable
                      ? 'bg-black text-white hover:bg-ink'
                      : 'border border-black/10 text-black hover:border-accent-cyan/60 hover:text-accent-cyan'
                  }`}
                >
                  {p.isAvailable ? 'Available' : 'Out of stock'}
                </button>
              </div>
            </div>
          </div>
        ))}

        {!loading && filtered.length === 0 && (
          <div className="rounded-2xl border border-black/10 bg-white p-5 text-sm text-black/60">
            Brak produktów do wyświetlenia.
          </div>
        )}
      </div>
    </div>
  )
}
