import React from 'react'

export default function PromoSection() {
  return (
    <section id="promocje" className="w-full bg-ink text-white py-fluid-md">
      <div className="max-w-[1800px] mx-auto px-fluid-sm">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-accent-deep/35 via-ink to-ink shadow-cyan-glow">
          <div className="absolute inset-0">
            <div className="absolute -top-24 -left-20 h-80 w-80 rounded-full bg-accent-cyan/20 blur-3xl" />
            <div className="absolute -bottom-28 -right-16 h-96 w-96 rounded-full bg-accent-tertiary/15 blur-3xl" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/60" />
          </div>

          <div className="relative p-6 sm:p-10 lg:p-14">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
              <div className="max-w-2xl">
                <p className="text-accent-cyan text-xs font-semibold tracking-[0.22em] uppercase">Promocje</p>
                <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
                  MysteryBox! Odbiór na miejscu
                </h2>
                <p className="mt-5 text-white/75 leading-relaxed">
                  Lubisz niespodzianki? Zarezerwuj MysteryBox i odbierz na miejscu. Płatność przy ladzie (gotówka/karta/BLIK).
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="/shop"
                  className="h-12 inline-flex items-center justify-center px-7 rounded-2xl bg-accent-cyan text-ink font-semibold tracking-[0.18em] uppercase text-[12px] hover:bg-white transition-colors shadow-cyan-glow"
                >
                  Zobacz produkty
                </a>
                <a
                  href="/checkout"
                  className="h-12 inline-flex items-center justify-center px-7 rounded-2xl border border-white/25 text-white font-semibold tracking-[0.18em] uppercase text-[12px] hover:border-white hover:bg-white/10 transition-colors"
                >
                  Zarezerwuj
                </a>
              </div>
            </div>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="text-xs tracking-[0.22em] uppercase text-white/60">Szybko</div>
                <div className="mt-2 font-black text-lg">Rezerwacja w 30s</div>
                <div className="mt-2 text-sm text-white/70">Klikasz, wybierasz termin, odbierasz na miejscu.</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="text-xs tracking-[0.22em] uppercase text-white/60">Premium</div>
                <div className="mt-2 font-black text-lg">Top selekcja</div>
                <div className="mt-2 text-sm text-white/70">Wyselekcjonowane propozycje i nowości.</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="text-xs tracking-[0.22em] uppercase text-white/60">Na miejscu</div>
                <div className="mt-2 font-black text-lg">Płatność przy ladzie</div>
                <div className="mt-2 text-sm text-white/70">Gotówka / karta / BLIK — bez bramek płatności.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

