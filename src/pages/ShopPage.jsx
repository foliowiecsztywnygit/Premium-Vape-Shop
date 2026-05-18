import React, { useEffect, useMemo, useState } from 'react'
import { getCategories, getProducts } from '../api/catalog'
import ProductCard from '../components/ProductCard'
import { useViewContext } from '../context/ViewContext'

export default function ShopPage({ slug }) {
  const { gridView } = useViewContext()
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    setLoadingCategories(true)
    getCategories()
      .then((data) => {
        if (!mounted) return
        setCategories(Array.isArray(data?.categories) ? data.categories : [])
        setLoadingCategories(false)
      })
      .catch(() => {
        if (!mounted) return
        setCategories([])
        setLoadingCategories(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  const activeSlug = useMemo(() => {
    if (slug) return slug
    return categories[0]?.slug || null
  }, [slug, categories])

  const activeCategory = useMemo(() => {
    return categories.find((c) => c.slug === activeSlug) || null
  }, [categories, activeSlug])

  useEffect(() => {
    let mounted = true
    setLoadingProducts(true)
    setError('')

    getProducts(activeSlug ? { category: activeSlug } : undefined)
      .then((data) => {
        if (!mounted) return
        setProducts(Array.isArray(data?.products) ? data.products : [])
        setLoadingProducts(false)
      })
      .catch((err) => {
        if (!mounted) return
        setProducts([])
        setError(err?.message || 'Błąd ładowania produktów')
        setLoadingProducts(false)
      })

    return () => {
      mounted = false
    }
  }, [activeSlug])

  const headerLabel = activeCategory?.name || (loadingCategories ? 'Sklep' : 'Sklep')

  return (
    <section className="w-full pt-28 lg:pt-32 bg-paper text-black min-h-[60vh]">
      <div className="max-w-[1800px] mx-auto px-fluid-sm py-fluid-md">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
          <div>
            <p className="text-accent-cyan text-xs font-semibold tracking-[0.22em] uppercase">Kategorie</p>
            <h1 className="mt-2 text-4xl md:text-5xl font-black tracking-tight">{headerLabel}</h1>
          </div>
          <div className="text-sm text-black/60 max-w-xl">
            {loadingProducts ? 'Ładowanie produktów…' : error ? error : `Dostępne produkty: ${products.length}`}
          </div>
        </div>

        <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-2">
          {loadingCategories && (
            <div className="text-xs tracking-[0.18em] uppercase text-black/40">Ładowanie kategorii…</div>
          )}

          {!loadingCategories &&
            categories.map((c) => {
              const isActive = c.slug === activeSlug
              return (
                <a
                  key={c.id}
                  href={`/shop/${c.slug}`}
                  className={`shrink-0 h-10 px-5 rounded-2xl border text-[11px] tracking-[0.18em] uppercase font-semibold transition-colors ${
                    isActive
                      ? 'bg-ink text-white border-ink shadow-cyan-glow'
                      : 'bg-white text-black border-black/10 hover:border-accent-cyan/50 hover:text-accent-deep'
                  }`}
                >
                  {c.name}
                </a>
              )
            })}
        </div>

        {!loadingCategories && categories.length === 0 && (
          <div className="mt-8 rounded-2xl border border-black/10 bg-white p-6 text-black/70">
            Brak kategorii w bazie. Dodaj je w panelu /admin.
          </div>
        )}

        {activeSlug && !loadingCategories && categories.length > 0 && !activeCategory && (
          <div className="mt-8 rounded-2xl border border-black/10 bg-white p-6 text-black/70">
            Nie znaleziono kategorii: <span className="font-mono">{activeSlug}</span>
          </div>
        )}

        <div
          className={`mt-10 grid gap-4 ${
            gridView === 'minimal'
              ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'
              : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4'
          }`}
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {!loadingProducts && !error && products.length === 0 && categories.length > 0 && (
          <div className="mt-10 rounded-2xl border border-black/10 bg-white p-6 text-black/70">
            Brak produktów w tej kategorii. Dodaj je w panelu /admin.
          </div>
        )}
      </div>
    </section>
  )
}

