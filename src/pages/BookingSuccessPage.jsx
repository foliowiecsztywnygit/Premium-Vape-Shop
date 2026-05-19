import React, { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../api/client'

function formatPrice(value, currency = 'PLN') {
  const safe = Number(value)
  if (!Number.isFinite(safe)) return ''
  const symbol = currency === 'PLN' ? 'zł' : currency
  return `${safe.toFixed(2).replace('.', ',')} ${symbol}`
}

function readQueryId() {
  try {
    return new URLSearchParams(window.location.search).get('id')
  } catch {
    return null
  }
}

export default function BookingSuccessPage() {
  const bookingId = useMemo(() => readQueryId(), [])
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError('')

    try {
      const cached = localStorage.getItem('pvsBookingSuccess')
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed?.id && (!bookingId || parsed.id === bookingId)) {
          setBooking(parsed)
          setLoading(false)
          return () => {
            mounted = false
          }
        }
      }
    } catch {}

    if (!bookingId) {
      setLoading(false)
      return () => {
        mounted = false
      }
    }

    apiFetch(`/api/bookings/${encodeURIComponent(bookingId)}`)
      .then((data) => {
        if (!mounted) return
        setBooking(data?.booking || null)
        setLoading(false)
      })
      .catch((err) => {
        if (!mounted) return
        setError(err?.message || 'Nie udało się pobrać rezerwacji')
        setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [bookingId])

  const items = Array.isArray(booking?.items) ? booking.items : []
  const currency = booking?.currency || 'PLN'
  const total = booking?.total ?? booking?.subtotal

  const pickupLabel = booking?.pickupTime
    ? new Intl.DateTimeFormat('pl-PL', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(booking.pickupTime))
    : null

  return (
    <div className="min-h-screen pt-28 lg:pt-32 pb-20 bg-paper text-black">
      <div className="max-w-5xl mx-auto px-fluid-sm">
        <div className="rounded-3xl border border-black/10 bg-white p-6 md:p-8">
          <p className="text-accent-cyan text-xs font-semibold tracking-[0.22em] uppercase">Potwierdzenie</p>
          <h1 className="mt-2 text-3xl md:text-4xl font-black tracking-tight">Rezerwacja przyjęta</h1>
          <p className="mt-4 text-black/70">
            Płatność zostanie zrealizowana na miejscu (gotówka / karta / BLIK).
          </p>

          {pickupLabel && (
            <div className="mt-4 rounded-2xl bg-paper p-4 border border-black/10">
              <div className="text-xs tracking-[0.18em] uppercase text-black/60">Godzina odbioru</div>
              <div className="mt-1 font-black text-lg">{pickupLabel}</div>
            </div>
          )}

          {loading && <div className="mt-6 text-black/60">Ładowanie…</div>}
          {error && <div className="mt-6 text-red-600 text-sm">{error}</div>}

          {!loading && !error && booking && (
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div>
                <h2 className="text-xl font-black tracking-tight">Podsumowanie</h2>
                <div className="mt-5 space-y-4">
                  {items.map((item, idx) => (
                    <div key={`${item.productId || idx}-${item.variantId || 'x'}`} className="flex gap-4 items-center">
                      {item.image ? (
                        <img src={item.image} alt={item.productName} className="w-14 h-14 rounded-xl object-cover bg-paper" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent-deep/15 to-accent-cyan/20" />
                      )}
                      <div className="flex-1">
                        <div className="font-bold">{item.productName}</div>
                        {item.variantName && <div className="text-xs text-black/60">{item.variantName}</div>}
                        <div className="text-xs text-black/60">Ilość: {item.quantity}</div>
                      </div>
                      <div className="font-bold">{formatPrice(Number(item.unitPrice) * Number(item.quantity), currency)}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 border-t border-black/10 pt-5 flex items-center justify-between">
                  <span className="text-sm text-black/60 tracking-[0.18em] uppercase">Razem</span>
                  <span className="text-2xl font-black">{formatPrice(total, currency)}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-black/10 bg-paper p-6">
                <h2 className="text-xl font-black tracking-tight">Co dalej?</h2>
                <div className="mt-4 text-sm text-black/70 leading-relaxed">
                  Przygotujemy Twoje produkty do odbioru. Jeśli potrzebujemy doprecyzowania wariantu lub dostępności,
                  skontaktujemy się telefonicznie.
                </div>

                <div className="mt-6 flex gap-3">
                  <a
                    href="/shop"
                    className="h-12 inline-flex items-center justify-center px-7 rounded-2xl bg-ink text-white font-semibold tracking-[0.18em] uppercase text-[12px] hover:bg-accent-deep transition-colors"
                  >
                    Wróć do sklepu
                  </a>
                  <a
                    href="/"
                    className="h-12 inline-flex items-center justify-center px-7 rounded-2xl border border-black/10 bg-white font-semibold tracking-[0.18em] uppercase text-[12px] hover:border-accent-cyan/60 transition-colors"
                  >
                    Strona główna
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
