import React, { useEffect, useMemo, useState } from 'react'
import { getSupabaseBrowser } from '../../supabase/client'

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

  const supabase = useMemo(() => getSupabaseBrowser(), [])

  useEffect(() => {
    let mounted = true
    if (!supabase) {
      setLoading(false)
      setError('Brak konfiguracji Supabase w .env (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)')
      return () => {
        mounted = false
      }
    }

    setLoading(true)
    setError('')

    supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (!mounted) return
        if (error) throw new Error(error.message)
        setBookings(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch((err) => {
        if (!mounted) return
        setError(err?.message || 'Błąd ładowania rezerwacji')
        setLoading(false)
      })

    const channel = supabase
      .channel('bookings-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => {
          setBookings((prev) => {
            const next = Array.isArray(prev) ? [...prev] : []
            const id = payload?.new?.id || payload?.old?.id
            if (!id) return next

            if (payload.eventType === 'INSERT') {
              return [payload.new, ...next.filter((x) => x.id !== id)]
            }

            if (payload.eventType === 'UPDATE') {
              const idx = next.findIndex((x) => x.id === id)
              if (idx === -1) return [payload.new, ...next]
              next[idx] = payload.new
              return next
            }

            if (payload.eventType === 'DELETE') {
              return next.filter((x) => x.id !== id)
            }

            return next
          })
        }
      )
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const updateStatus = async (bookingId, booking_status) => {
    if (!supabase) return
    const { error } = await supabase.from('bookings').update({ booking_status }).eq('id', bookingId)
    if (error) setError(error.message)
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
                    {formatDate(b.created_at)} • Odbiór: {formatDate(b.pickup_time)}
                  </div>
                  <div className="mt-2 font-black text-lg truncate">{b.customer_name}</div>
                  <div className="mt-1 text-sm text-black/70">{b.phone}</div>
                  {b.notes && <div className="mt-3 text-sm text-black/70">{b.notes}</div>}
                </div>

                <div className="flex flex-col items-start md:items-end gap-3">
                  <div className="text-2xl font-black">{formatPrice(total, b.currency || 'PLN')}</div>
                  <div className="text-xs tracking-[0.18em] uppercase text-black/60">
                    Płatność: {b.payment_status || 'pay_at_counter'}
                  </div>
                  <select
                    value={b.booking_status || 'confirmed'}
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

