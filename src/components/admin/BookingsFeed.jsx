import React, { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../../api/client'

function formatPrice(value, currency = 'PLN') {
  const safe = Number(value)
  if (!Number.isFinite(safe)) return ''
  const symbol = currency === 'PLN' ? 'zł' : currency
  return `${safe.toFixed(2).replace('.', ',')} ${symbol}`
}

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat('pl-PL', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value))
  } catch {
    return ''
  }
}

const STATUS_OPTIONS = [
  { value: 'confirmed', label: 'Potwierdzone' },
  { value: 'preparing', label: 'W przygotowaniu' },
  { value: 'ready', label: 'Gotowe do odbioru' },
  { value: 'completed', label: 'Odebrane' },
  { value: 'cancelled', label: 'Anulowane' },
]

export default function BookingsFeed() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    const token = localStorage.getItem('pvs-admin-token')
    if (!token) {
      setLoading(false)
      setError('Brak tokenu admina. Zaloguj się w panelu.')
      return () => {
        mounted = false
      }
    }

    setLoading(true)
    setError('')

    apiFetch('/api/admin/bookings', {
      headers: {
        'x-admin-token': token,
      },
    })
      .then((data) => {
        if (!mounted) return
        setBookings(Array.isArray(data?.bookings) ? data.bookings : [])
        setLoading(false)
      })
      .catch((err) => {
        if (!mounted) return
        setError(err?.message || 'Błąd ładowania rezerwacji')
        setLoading(false)
      })

    const es = new EventSource(`/api/admin/bookings/stream?token=${encodeURIComponent(token)}`)

    es.addEventListener('upsert', (ev) => {
      try {
        const nextBooking = JSON.parse(ev.data || '{}')
        if (!nextBooking?.id) return
        setBookings((prev) => {
          const next = Array.isArray(prev) ? [...prev] : []
          const idx = next.findIndex((x) => x.id === nextBooking.id)
          if (idx === -1) return [nextBooking, ...next]
          next[idx] = nextBooking
          return next
        })
      } catch {}
    })

    es.addEventListener('error', () => {
      setError((prev) => prev || 'Utracono połączenie realtime. Odśwież stronę.')
    })

    return () => {
      mounted = false
      es.close()
    }
  }, [])

  const updateStatus = async (bookingId, bookingStatus) => {
    const token = localStorage.getItem('pvs-admin-token')
    if (!token) return
    try {
      await apiFetch(`/api/admin/bookings/${encodeURIComponent(bookingId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify({ bookingStatus }),
      })
    } catch (e) {
      setError(e?.message || 'Nie udało się zapisać statusu')
    }
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-accent-cyan text-xs font-semibold tracking-[0.22em] uppercase">Dashboard</p>
          <h2 className="mt-2 text-2xl md:text-3xl font-black tracking-tight">Rezerwacje (Click & Collect)</h2>
        </div>
        <div className="text-sm text-black/60">
          {loading ? 'Ładowanie…' : error ? error : `Łącznie: ${bookings.length}`}
        </div>
      </div>

      <div className="mt-8 grid gap-4">
        {bookings.map((b) => {
          const items = Array.isArray(b.items) ? b.items : []
          const total = b.total ?? b.subtotal
          return (
            <div key={b.id} className="rounded-2xl border border-black/10 bg-paper p-5">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-[11px] tracking-[0.22em] uppercase text-black/50">
                    {formatDate(b.createdAt)} • Odbiór: {formatDate(b.pickupTime)}
                  </div>
                  <div className="mt-2 font-black text-lg truncate">{b.customerName}</div>
                  <div className="mt-1 text-sm text-black/70">{b.phone}</div>
                  {b.notes && <div className="mt-3 text-sm text-black/70">{b.notes}</div>}
                </div>

                <div className="flex flex-col items-start md:items-end gap-3">
                  <div className="text-2xl font-black">{formatPrice(total, b.currency || 'PLN')}</div>
                  <div className="text-xs tracking-[0.18em] uppercase text-black/60">
                    Płatność: {b.paymentStatus || 'pay_at_counter'}
                  </div>
                  <select
                    value={b.bookingStatus || 'confirmed'}
                    onChange={(e) => updateStatus(b.id, e.target.value)}
                    className="h-10 px-4 rounded-2xl border border-black/10 bg-white focus:outline-none focus:border-accent-cyan text-[12px] tracking-[0.14em] uppercase font-semibold"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 border-t border-black/10 pt-4 grid gap-2">
                {items.map((it, idx) => (
                  <div key={`${it.productId || idx}-${it.variantId || 'x'}`} className="flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{it.productName}</div>
                      {it.variantName && <div className="text-xs text-black/60 truncate">{it.variantName}</div>}
                    </div>
                    <div className="text-black/70 tabular-nums">
                      {it.quantity} × {formatPrice(it.unitPrice, b.currency || 'PLN')}
                    </div>
                  </div>
                ))}
                {items.length === 0 && <div className="text-sm text-black/60">Brak pozycji (items=[])</div>}
              </div>
            </div>
          )
        })}

        {!loading && !error && bookings.length === 0 && (
          <div className="rounded-2xl border border-black/10 bg-paper p-6 text-black/70">
            Brak rezerwacji. Nowe pojawią się tutaj automatycznie w czasie rzeczywistym.
          </div>
        )}
      </div>
    </div>
  )
}
