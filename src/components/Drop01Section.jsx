import React, { useEffect, useMemo, useState } from 'react'
import { getProducts } from '../api/catalog'
import ProductCard from './ProductCard'
import { useViewContext } from '../context/ViewContext'

export default function Drop01Section() {
  const { gridView } = useViewContext()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError('')
    getProducts()
      .then((data) => {
        if (!mounted) return
        setProducts(Array.isArray(data?.products) ? data.products : [])
        setLoading(false)
      })
      .catch((err) => {
        if (!mounted) return
        setError(err?.message || 'Błąd ładowania produktów')
        setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  const visibleProducts = useMemo(() => {
    return products.slice(0, gridView === 'minimal' ? 12 : 6)
  }, [products, gridView])

  return (
    <section id="katalog" className="w-full bg-paper text-black py-fluid-md">
      <div className="max-w-[1800px] mx-auto px-fluid-sm">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-accent-cyan text-xs font-semibold tracking-[0.22em] uppercase">
              Co nowego w sklepie?
            </p>
            <h2 className="mt-2 text-4xl md:text-5xl font-black tracking-tight">
              Nowości
            </h2>
          </div>
          <div className="text-sm text-black/60 max-w-xl">
            {loading ? 'Ładowanie produktów…' : error ? error : `Dostępne produkty: ${products.length}`}
          </div>
        </div>

        <div className={`mt-10 grid gap-4 ${
          gridView === 'minimal'
            ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'
            : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4'
        }`}>
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {!loading && !error && products.length === 0 && (
          <div className="mt-10 rounded-2xl border border-black/10 bg-white p-6 text-black/70">
            Brak produktów w bazie. Wejdź w panel /admin i dodaj pierwszy produkt.
          </div>
        )}
      </div>
    </section>
  )
}
