import React, { useEffect, useState } from 'react'
import { getCategories } from '../api/catalog'
import { BUSINESS } from '../config/business'
import Logo from '../assets/brand/logo.png'

function categoryTint(index) {
  const tints = [
    'bg-sky-50',
    'bg-emerald-50',
    'bg-slate-100',
    'bg-indigo-50',
    'bg-amber-50',
    'bg-teal-50',
  ]
  return tints[index % tints.length]
}

export default function Hero() {
  const [categories, setCategories] = useState([])

  useEffect(() => {
    let mounted = true
    getCategories()
      .then((data) => {
        if (!mounted) return
        setCategories(Array.isArray(data?.categories) ? data.categories : [])
      })
      .catch(() => {
        if (!mounted) return
        setCategories([])
      })
    return () => {
      mounted = false
    }
  }, [])

  return (
    <section className="w-full pt-28 lg:pt-32">
      <div className="max-w-[1800px] mx-auto px-fluid-sm">
        <div className="relative overflow-hidden rounded-3xl bg-accent-gradient shadow-cyan-glow">
          <div className="absolute inset-0">
            <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
            <div className="absolute -bottom-28 -right-24 h-80 w-80 rounded-full bg-black/20 blur-3xl" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/40" />
          </div>

          <div className="relative py-fluid-lg px-fluid-sm text-center flex flex-col items-center">
            <div className="relative">
              <div className="absolute -inset-6 rounded-[48px] bg-white/10 blur-3xl" />
              <img
                src={Logo}
                alt={`${BUSINESS.name} logo`}
                className="relative w-[240px] sm:w-[320px] md:w-[420px] lg:w-[520px] h-auto object-contain"
                draggable="false"
                loading="eager"
              />
            </div>

            <p className="mt-5 text-white/85 max-w-2xl text-base sm:text-lg tracking-wide">
              Luksusowy wybór liquidów, e-papierosów i premium akcesoriów w sercu Ursynowa. {BUSINESS.addressLine1},{' '}
              {BUSINESS.addressLine2}.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="/shop"
                className="inline-flex items-center justify-center h-12 px-7 rounded-2xl bg-white text-black font-semibold tracking-[0.18em] uppercase text-[12px] hover:bg-black hover:text-white transition-colors shadow-cyan-glow"
              >
                Przeglądaj sklep
              </a>
              <a
                href="/#kontakt"
                className="inline-flex items-center justify-center h-12 px-7 rounded-2xl border border-white/30 text-white font-semibold tracking-[0.18em] uppercase text-[12px] hover:border-white hover:bg-white/10 transition-colors"
              >
                Kontakt
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-fluid-md bg-paper text-black">
        <div className="max-w-[1800px] mx-auto px-fluid-sm py-fluid-md">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
            <div>
              <p className="text-accent-cyan text-xs font-semibold tracking-[0.22em]">KATEGORIE</p>
              <h2 className="mt-2 text-3xl md:text-4xl font-black tracking-tight">Co szukasz dzisiaj?</h2>
            </div>
            <p className="text-sm text-black/60 max-w-xl">
              Wybierz kategorię i przejdź do asortymentu. Ten sam produkt w różnych wariantach traktujemy jako osobne
              pozycje w koszyku.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {categories.map((category, index) => (
              <a
                key={category.id}
                href={`/shop/${category.slug}`}
                className={`group relative overflow-hidden rounded-2xl ${categoryTint(
                  index
                )} p-4 min-h-[140px] flex flex-col justify-between border border-black/5 hover:border-accent-cyan/40 transition-colors`}
              >
                <div className="absolute -right-10 -top-10 h-28 w-28 rounded-3xl bg-gradient-to-br from-accent-deep/30 to-accent-cyan/35 rotate-12 group-hover:scale-105 transition-transform duration-300" />
                <div className="relative flex-1 flex items-center justify-center">
                  <div className="h-16 w-16 rounded-2xl bg-white/70 backdrop-blur flex items-center justify-center border border-black/5 group-hover:shadow-cyan-glow transition-shadow">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-accent-deep/25 to-accent-cyan/35 group-hover:scale-105 transition-transform" />
                  </div>
                </div>
                <div className="relative">
                  <p className="text-[12px] font-bold tracking-[0.18em] uppercase">{category.name}</p>
                </div>
              </a>
            ))}
          </div>

          {categories.length === 0 && (
            <div className="mt-6 rounded-2xl border border-black/10 bg-white p-5 text-sm text-black/60">
              Brak kategorii w bazie. Dodaj je w panelu /admin.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
