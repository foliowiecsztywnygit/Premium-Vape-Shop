import React, { useEffect, useMemo, useState } from 'react'
import { useCartStore } from '../store/cartStore'
import { BUSINESS } from '../config/business'
import { apiFetch } from '../api/client'

function formatPrice(value, currency = 'PLN') {
  const safe = Number(value)
  if (!Number.isFinite(safe)) return ''
  const symbol = currency === 'PLN' ? 'zł' : currency
  return `${safe.toFixed(2).replace('.', ',')} ${symbol}`
}

function toDateInputValue(date) {
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function buildAvailableDates({ days = 7 } = {}) {
  const now = new Date()
  const dates = []
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)

  for (let i = 0; i < days; i += 1) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const weekday = d.getDay()
    const hours = BUSINESS.hours[weekday]
    if (!hours) continue
    dates.push({
      value: toDateInputValue(d),
      label: new Intl.DateTimeFormat('pl-PL', { weekday: 'short', day: '2-digit', month: '2-digit' }).format(d),
      weekday,
      hours,
    })
  }

  return dates
}

function buildTimesForDate({ dateValue, stepMinutes = 30 } = {}) {
  if (!dateValue) return []
  const [y, m, d] = String(dateValue).split('-').map((x) => Number(x))
  if (!y || !m || !d) return []

  const day = new Date(y, m - 1, d, 0, 0, 0, 0)
  const weekday = day.getDay()
  const hours = BUSINESS.hours[weekday]
  if (!hours) return []

  const [openH, openM] = String(hours.open).split(':').map((x) => Number(x))
  const [closeH, closeM] = String(hours.close).split(':').map((x) => Number(x))

  const first = new Date(day)
  first.setHours(openH, openM, 0, 0)

  const last = new Date(day)
  last.setHours(closeH, closeM, 0, 0)

  const now = new Date()
  const minTs = now.getTime() + 15 * 60 * 1000

  const times = []
  for (let t = new Date(first); t < last; t = new Date(t.getTime() + stepMinutes * 60 * 1000)) {
    if (t.getTime() < minTs) continue
    const hh = String(t.getHours()).padStart(2, '0')
    const mm = String(t.getMinutes()).padStart(2, '0')
    times.push({ value: `${hh}:${mm}`, label: `${hh}:${mm}` })
  }
  return times
}

export default function CheckoutPage() {
  const { items, getSubtotal, clearCart } = useCartStore()
  const [customerName, setCustomerName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [pickupDate, setPickupDate] = useState('')
  const [pickupClock, setPickupClock] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const availableDates = useMemo(() => buildAvailableDates({ days: 7 }), [])
  const availableTimes = useMemo(() => buildTimesForDate({ dateValue: pickupDate, stepMinutes: 30 }), [pickupDate])
  const pickupTime = useMemo(() => {
    if (!pickupDate || !pickupClock) return ''
    const local = new Date(`${pickupDate}T${pickupClock}:00`)
    if (!Number.isFinite(local.getTime())) return ''
    return local.toISOString()
  }, [pickupDate, pickupClock])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('pvsBookingDetails')
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (parsed?.customerName) setCustomerName(String(parsed.customerName))
      if (parsed?.phone) setPhone(String(parsed.phone))
      if (parsed?.notes) setNotes(String(parsed.notes))
      if (parsed?.pickupDate) setPickupDate(String(parsed.pickupDate))
      if (parsed?.pickupClock) setPickupClock(String(parsed.pickupClock))
      if (!parsed?.pickupDate && !parsed?.pickupClock && parsed?.pickupTime) {
        const d = new Date(String(parsed.pickupTime))
        if (Number.isFinite(d.getTime())) {
          setPickupDate(toDateInputValue(d))
          const hh = String(d.getHours()).padStart(2, '0')
          const mm = String(d.getMinutes()).padStart(2, '0')
          setPickupClock(`${hh}:${mm}`)
        }
      }
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(
        'pvsBookingDetails',
        JSON.stringify({ customerName, phone, notes, pickupDate, pickupClock })
      )
    } catch {}
  }, [customerName, phone, notes, pickupDate, pickupClock])

  useEffect(() => {
    if (!pickupDate && availableDates[0]?.value) setPickupDate(availableDates[0].value)
  }, [pickupDate, availableDates])

  useEffect(() => {
    if (!pickupClock && availableTimes[0]?.value) setPickupClock(availableTimes[0].value)
  }, [pickupClock, availableTimes])

  const subtotal = getSubtotal()
  const currency = 'PLN'

  const canSubmit =
    items.length > 0 &&
    customerName.trim().length >= 2 &&
    phone.trim().length >= 7 &&
    !!pickupTime &&
    !loading

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const payload = {
        customerName: customerName.trim(),
        phone: phone.trim(),
        notes: notes.trim() || null,
        pickupTime,
        items: items.map((x) => ({
          productId: x.productId,
          variantId: x.variantId,
          variantName: x.variantName || null,
          productName: x.productName,
          image: x.image || null,
          unitPrice: x.unitPrice,
          quantity: x.quantity,
        })),
        currency,
        subtotal: Number(subtotal),
        total: Number(subtotal),
      }

      const data = await apiFetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const booking = data?.booking
      if (!booking?.id) throw new Error('Nie udało się utworzyć rezerwacji')

      try {
        localStorage.setItem('pvsBookingSuccess', JSON.stringify(booking))
        localStorage.removeItem('pvsBookingDetails')
      } catch {}

      clearCart()
      window.history.pushState({}, '', `/booking-success?id=${encodeURIComponent(booking.id)}`)
      window.dispatchEvent(new Event('popstate'))
      window.scrollTo(0, 0)
    } catch (err) {
      setError(err?.message || 'Nie udało się utworzyć rezerwacji')
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-32 px-4 flex items-center justify-center bg-ink text-white">
        <div className="text-center">
          <h1 className="text-3xl font-black uppercase tracking-widest font-montserrat mb-4">Twój koszyk jest pusty</h1>
          <a href="/" className="underline hover:text-gray-300">
            Wróć do sklepu
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-28 lg:pt-32 pb-20 bg-paper text-black">
      <div className="max-w-6xl mx-auto px-fluid-sm">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-accent-cyan text-xs font-semibold tracking-[0.22em] uppercase">Click & Collect</p>
            <h1 className="mt-2 text-3xl md:text-4xl font-black tracking-tight">Zarezerwuj i odbierz na miejscu</h1>
          </div>
          <div className="text-sm text-black/60 max-w-xl">
            Płatność przy ladzie (gotówka / karta / BLIK). Rezerwacja jest od razu potwierdzona.
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
          <form onSubmit={submit} className="rounded-2xl border border-black/10 bg-white p-6">
            <div className="grid gap-4">
              <div>
                <label className="block text-xs tracking-[0.18em] uppercase text-black/60">Imię i nazwisko</label>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="mt-2 w-full h-12 px-4 rounded-2xl border border-black/10 bg-white focus:outline-none focus:border-accent-cyan"
                  placeholder="np. Jan Kowalski"
                  required
                />
              </div>

              <div>
                <label className="block text-xs tracking-[0.18em] uppercase text-black/60">Telefon</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-2 w-full h-12 px-4 rounded-2xl border border-black/10 bg-white focus:outline-none focus:border-accent-cyan"
                  placeholder="np. 797 745 829"
                  required
                />
              </div>

              <div>
                <label className="block text-xs tracking-[0.18em] uppercase text-black/60">Termin odbioru</label>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={pickupDate}
                    min={availableDates[0]?.value || undefined}
                    max={availableDates[availableDates.length - 1]?.value || undefined}
                    onChange={(e) => {
                      setPickupDate(e.target.value)
                      setPickupClock('')
                    }}
                    className="w-full h-12 px-4 rounded-2xl border border-black/10 bg-white focus:outline-none focus:border-accent-cyan"
                    required
                  />
                  <select
                    value={pickupClock}
                    onChange={(e) => setPickupClock(e.target.value)}
                    className="w-full h-12 px-4 rounded-2xl border border-black/10 bg-white focus:outline-none focus:border-accent-cyan"
                    required
                  >
                    {availableTimes.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                {pickupDate && availableTimes.length === 0 && (
                  <div className="mt-2 text-sm text-black/60">
                    Brak dostępnych godzin dla tego dnia (lub jest już za późno na dzisiejszy odbiór).
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs tracking-[0.18em] uppercase text-black/60">Uwagi do zamówienia</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-2 w-full min-h-[120px] px-4 py-3 rounded-2xl border border-black/10 bg-white focus:outline-none focus:border-accent-cyan"
                  placeholder="np. preferowany smak, uwagi do wariantu, prośba o telefon przed odbiorem…"
                />
              </div>

              {error && <div className="text-sm text-red-600">{error}</div>}

              <button
                type="submit"
                disabled={!canSubmit}
                className="h-12 rounded-2xl bg-accent-deep text-white font-semibold tracking-[0.18em] uppercase text-[12px] hover:bg-accent-cyan hover:text-ink transition-colors disabled:opacity-50 shadow-cyan-glow"
              >
                {loading ? 'Tworzę rezerwację…' : 'Zarezerwuj i odbierz na miejscu'}
              </button>

              <div className="text-xs text-black/50 tracking-[0.12em] uppercase">
                Odbiór: {BUSINESS.addressLine1}, {BUSINESS.addressLine2}
              </div>
            </div>
          </form>

          <div className="rounded-2xl border border-black/10 bg-white p-6 h-fit">
            <h2 className="text-xl font-black tracking-tight">Podsumowanie</h2>
            <div className="mt-6 space-y-4 max-h-96 overflow-auto pr-1">
              {items.map((item) => (
                <div key={`${item.productId}-${item.variantId}`} className="flex items-center gap-4">
                  <div className="relative">
                    {item.image ? (
                      <img src={item.image} alt={item.productName} className="w-14 h-14 object-cover rounded-xl bg-paper" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent-deep/15 to-accent-cyan/20" />
                    )}
                    <span className="absolute -top-2 -right-2 bg-ink text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm">{item.productName}</div>
                    {item.variantName && <div className="text-xs text-black/60">{item.variantName}</div>}
                  </div>
                  <div className="text-sm font-bold">{formatPrice(item.unitPrice * item.quantity, currency)}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-black/10 pt-5 flex items-center justify-between">
              <span className="text-sm text-black/60 tracking-[0.18em] uppercase">Razem</span>
              <span className="text-2xl font-black">{formatPrice(subtotal, currency)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
