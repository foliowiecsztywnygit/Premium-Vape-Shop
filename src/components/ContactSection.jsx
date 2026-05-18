import React, { useEffect, useState } from 'react'
import { BUSINESS, getOpenStatus } from '../config/business'

function formatDay(dayIndex) {
  const map = {
    1: 'Poniedziałek',
    2: 'Wtorek',
    3: 'Środa',
    4: 'Czwartek',
    5: 'Piątek',
    6: 'Sobota',
    0: 'Niedziela',
  }
  return map[dayIndex]
}

export default function ContactSection() {
  const [status, setStatus] = useState(() => getOpenStatus())

  useEffect(() => {
    const id = setInterval(() => setStatus(getOpenStatus()), 30_000)
    return () => clearInterval(id)
  }, [])

  const phoneHref = `tel:${BUSINESS.phone.replace(/\s/g, '')}`

  return (
    <section id="kontakt" className="w-full bg-ink text-white py-fluid-md">
      <div className="max-w-[1800px] mx-auto px-fluid-sm">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-accent-cyan text-xs font-semibold tracking-[0.22em] uppercase">Kontakt</p>
            <h2 className="mt-3 text-3xl md:text-5xl font-black tracking-tight">Wpadnij na Ursynów</h2>
          </div>
          <div className="inline-flex items-center gap-2 text-[11px] tracking-[0.22em] uppercase">
            <span className={`h-2.5 w-2.5 rounded-full ${status.isOpen ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            <span className="text-white/75">{status.label}</span>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="grid gap-5">
                <div>
                  <div className="text-xs tracking-[0.22em] uppercase text-white/60">Adres</div>
                  <div className="mt-2 font-black text-xl">{BUSINESS.addressLine1}</div>
                  <div className="text-white/70">{BUSINESS.addressLine2}</div>
                </div>

                <div>
                  <div className="text-xs tracking-[0.22em] uppercase text-white/60">Telefon</div>
                  <a href={phoneHref} className="mt-2 inline-flex items-center font-black text-xl hover:text-accent-cyan transition-colors">
                    {BUSINESS.phone}
                  </a>
                </div>

                <div>
                  <div className="text-xs tracking-[0.22em] uppercase text-white/60">Godziny</div>
                  <div className="mt-3 grid gap-2 text-sm">
                    {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                      const h = BUSINESS.hours[d]
                      const label = h ? `${h.open}–${h.close}` : 'Zamknięte'
                      return (
                        <div key={d} className="flex items-center justify-between gap-4 border-b border-white/10 pb-2">
                          <span className="text-white/75">{formatDay(d)}</span>
                          <span className="text-white/55 tabular-nums">{label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <a
                    href="/checkout"
                    className="h-12 inline-flex items-center justify-center px-7 rounded-2xl bg-accent-deep text-white font-semibold tracking-[0.18em] uppercase text-[12px] hover:bg-accent-cyan hover:text-ink transition-colors shadow-cyan-glow"
                  >
                    Zarezerwuj odbiór
                  </a>
                  <a
                    href="/shop"
                    className="h-12 inline-flex items-center justify-center px-7 rounded-2xl border border-white/20 text-white font-semibold tracking-[0.18em] uppercase text-[12px] hover:border-white hover:bg-white/10 transition-colors"
                  >
                    Sklep
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/20 overflow-hidden min-h-[360px]">
            <iframe
              title="Mapa Premium Vape Shop Ursynów"
              className="w-full h-full min-h-[360px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src="https://www.google.com/maps?q=Belgradzka%2014%20Warszawa&output=embed"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

