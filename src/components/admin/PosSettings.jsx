import React, { useEffect, useState } from 'react'
import { apiFetch } from '../../api/client'

const PROVIDERS = [
  { key: 'ipos', label: 'iPOS (webhook)' },
  { key: 'dotykacka', label: 'Dotykačka (poll)' },
  { key: 'gopos', label: 'GoPOS (webhook HMAC)' },
  { key: 'subiekt', label: 'Subiekt (bridge)' },
]

export default function PosSettings() {
  const [storeId, setStoreId] = useState('default')
  const [rows, setRows] = useState(() =>
    PROVIDERS.map((p) => ({
      posProvider: p.key,
      apiToken: '',
      warehouseId: '',
      webhookSecret: '',
    }))
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')

  const load = async () => {
    const token = localStorage.getItem('pvs-admin-token')
    if (!token) {
      setLoading(false)
      setError('Brak tokenu admina. Zaloguj się w panelu.')
      return
    }
    setLoading(true)
    setError('')
    setSaved('')
    try {
      const data = await apiFetch(`/api/admin/pos-settings?storeId=${encodeURIComponent(storeId)}`, {
        headers: { 'x-admin-token': token },
      })
      const fromApi = Array.isArray(data?.settings) ? data.settings : []
      setRows(
        PROVIDERS.map((p) => {
          const match = fromApi.find((x) => x.posProvider === p.key)
          return {
            posProvider: p.key,
            apiToken: match?.apiToken || '',
            warehouseId: match?.warehouseId || '',
            webhookSecret: match?.webhookSecret || '',
          }
        })
      )
      setLoading(false)
    } catch (e) {
      setLoading(false)
      setError(e?.message || 'Błąd ładowania ustawień POS')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const saveRow = async (posProvider) => {
    const token = localStorage.getItem('pvs-admin-token')
    if (!token) return
    setError('')
    setSaved('')
    try {
      const row = rows.find((x) => x.posProvider === posProvider)
      await apiFetch('/api/admin/pos-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify({
          storeId,
          posProvider,
          apiToken: row?.apiToken || null,
          warehouseId: row?.warehouseId || null,
          webhookSecret: row?.webhookSecret || null,
        }),
      })
      setSaved('Zapisano')
      setTimeout(() => setSaved(''), 1800)
    } catch (e) {
      setError(e?.message || 'Nie udało się zapisać ustawień POS')
    }
  }

  const setField = (provider, field, value) => {
    setRows((prev) =>
      prev.map((x) => (x.posProvider === provider ? { ...x, [field]: value } : x))
    )
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-accent-cyan text-xs font-semibold tracking-[0.22em] uppercase">POS</p>
          <h2 className="mt-2 text-xl font-black tracking-tight">Integracje</h2>
        </div>
        <div className="grid grid-cols-1 sm:flex gap-2">
          <input
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            placeholder="storeId (np. default)"
            className="h-11 w-full sm:w-56 px-4 rounded-2xl border border-black/10 focus:outline-none focus:border-accent-cyan"
          />
          <button
            type="button"
            onClick={load}
            className="h-11 w-full sm:w-auto px-4 rounded-2xl border border-black/10 text-[12px] tracking-[0.18em] uppercase font-semibold hover:border-accent-cyan/60 hover:text-accent-cyan transition-colors"
          >
            Wczytaj
          </button>
        </div>
      </div>

      {error && <div className="mt-4 text-sm text-rose-600 font-semibold">{error}</div>}
      {saved && <div className="mt-4 text-sm text-emerald-700 font-semibold">{saved}</div>}
      {loading && <div className="mt-4 text-sm text-black/60">Ładowanie…</div>}

      <div className="mt-6 grid gap-4">
        {PROVIDERS.map((p) => {
          const row = rows.find((x) => x.posProvider === p.key)
          return (
            <div key={p.key} className="rounded-2xl border border-black/5 p-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="font-black">{p.label}</div>
                  <div className="mt-1 text-xs tracking-[0.18em] uppercase text-black/50">storeId: {storeId}</div>
                </div>
                <button
                  type="button"
                  onClick={() => saveRow(p.key)}
                  className="h-11 px-4 rounded-2xl bg-black text-white text-[12px] tracking-[0.18em] uppercase font-semibold hover:bg-ink transition-colors"
                >
                  Zapisz
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
                <input
                  value={row?.webhookSecret || ''}
                  onChange={(e) => setField(p.key, 'webhookSecret', e.target.value)}
                  placeholder="webhookSecret (webhook)"
                  className="h-11 px-4 rounded-2xl border border-black/10 focus:outline-none focus:border-accent-cyan"
                />
                <input
                  value={row?.apiToken || ''}
                  onChange={(e) => setField(p.key, 'apiToken', e.target.value)}
                  placeholder="apiToken (Dotykačka)"
                  className="h-11 px-4 rounded-2xl border border-black/10 focus:outline-none focus:border-accent-cyan"
                />
                <input
                  value={row?.warehouseId || ''}
                  onChange={(e) => setField(p.key, 'warehouseId', e.target.value)}
                  placeholder="warehouseId (Dotykačka)"
                  className="h-11 px-4 rounded-2xl border border-black/10 focus:outline-none focus:border-accent-cyan"
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

