import React, { useEffect, useMemo, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { getProduct, getProducts } from '../api/catalog'
import { useCartStore } from '../store/cartStore'
import ProductCard from '../components/ProductCard'

function formatPrice(value, currency) {
  const safe = Number(value)
  if (!Number.isFinite(safe)) return ''
  const symbol = currency === 'PLN' ? 'zł' : currency
  return `${safe.toFixed(2).replace('.', ',')} ${symbol}`
}

export default function ProductPage({ id }) {
  const addItem = useCartStore((state) => state.addItem)
  const openCart = useCartStore((state) => state.openCart)

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [imgIndex, setImgIndex] = useState(0)
  const [variantId, setVariantId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [similar, setSimilar] = useState([])

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError('')
    setProduct(null)
    setImgIndex(0)
    setQuantity(1)
    setVariantId('')
    setSimilar([])

    getProduct(id)
      .then((data) => {
        if (!mounted) return null
        const p = data?.product || null
        setProduct(p)
        setVariantId(p?.variants?.[0]?.id || '')
        setLoading(false)
        return p
      })
      .then((p) => {
        if (!mounted || !p?.category?.slug) return
        return getProducts({ category: p.category.slug })
          .then((data) => {
            if (!mounted) return
            const items = Array.isArray(data?.products) ? data.products : []
            setSimilar(items.filter((x) => x.id !== p.id).slice(0, 4))
          })
          .catch(() => {})
      })
      .catch((err) => {
        if (!mounted) return
        setError(err?.message || 'Nie udało się załadować produktu')
        setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [id])

  const images = useMemo(() => {
    if (!product?.images) return []
    return product.images.map((x) => x?.url).filter(Boolean)
  }, [product])

  const selectedVariant = useMemo(() => {
    if (!product?.variants?.length) return null
    return product.variants.find((v) => v.id === variantId) || null
  }, [product, variantId])

  const unitPrice = selectedVariant?.price ?? product?.basePrice
  const priceLabel = formatPrice(unitPrice, product?.currency)

  const canAddToCart = !!product && (product.variants?.length ? !!variantId : true) && quantity >= 1

  const addToCart = () => {
    if (!canAddToCart) return
    const image = images[0] || null
    addItem({
      productId: product.id,
      variantId: variantId || null,
      variantName: selectedVariant?.name || null,
      quantity,
      unitPrice: Number(unitPrice),
      image,
      productName: product.name,
    })
    openCart()
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-20 bg-paper text-black">
        <div className="max-w-[1600px] mx-auto px-fluid-sm">Ładowanie…</div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen pt-32 pb-20 bg-paper text-black">
        <div className="max-w-[1600px] mx-auto px-fluid-sm">{error || 'Nie znaleziono produktu'}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-28 lg:pt-32 pb-20 bg-paper text-black">
      <div className="max-w-[1600px] mx-auto px-fluid-sm">
        <nav className="text-xs tracking-[0.18em] uppercase text-black/50">
          <a href="/" className="hover:text-black">
            Strona Główna
          </a>
          <span className="mx-2">/</span>
          <a href="/shop" className="hover:text-black">
            Sklep
          </a>
          {product.category?.name && product.category?.slug && (
            <>
              <span className="mx-2">/</span>
              <a href={`/shop/${product.category.slug}`} className="hover:text-black">
                {product.category.name}
              </a>
            </>
          )}
          <span className="mx-2">/</span>
          <span className="text-black/70">{product.name}</span>
        </nav>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20">
          <div>
            <div className="w-full aspect-[4/5] bg-white rounded-2xl border border-black/5 flex items-center justify-center overflow-hidden">
              {images[imgIndex] ? (
                <img src={images[imgIndex]} alt={product.name} className="w-full h-full object-contain p-10" />
              ) : (
                <div className="h-28 w-28 rounded-2xl bg-gradient-to-br from-accent-deep/20 to-accent-cyan/25" />
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-auto">
                {images.map((url, idx) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setImgIndex(idx)}
                    className={`h-20 w-20 rounded-xl border ${
                      idx === imgIndex ? 'border-accent-cyan' : 'border-black/10'
                    } bg-white flex items-center justify-center`}
                  >
                    <img src={url} alt="" className="h-full w-full object-contain p-2" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">{product.name}</h1>
            <div className="mt-4 flex items-center gap-4">
              <p className="text-xl font-semibold">{priceLabel}</p>
              <span className="text-xs tracking-[0.22em] uppercase text-accent-cyan font-semibold">
                Premium Vape Shop Ursynów
              </span>
            </div>

            {product.description && <p className="mt-6 text-black/70 leading-relaxed">{product.description}</p>}

            {Array.isArray(product.variants) && product.variants.length > 0 && (
              <div className="mt-8">
                <label className="block text-xs tracking-[0.18em] uppercase text-black/60">Wybierz opcję</label>
                <select
                  value={variantId}
                  onChange={(e) => setVariantId(e.target.value)}
                  className="mt-3 w-full h-12 px-4 rounded-2xl border border-black/10 bg-white focus:outline-none focus:border-accent-cyan"
                >
                  {product.variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:items-center">
              <div className="inline-flex items-center rounded-2xl border border-black/10 bg-white h-12">
                <button
                  type="button"
                  className="h-12 w-12 inline-flex items-center justify-center"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Zmniejsz ilość"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <div className="px-4 font-semibold tabular-nums">{quantity}</div>
                <button
                  type="button"
                  className="h-12 w-12 inline-flex items-center justify-center"
                  onClick={() => setQuantity((q) => q + 1)}
                  aria-label="Zwiększ ilość"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={addToCart}
                disabled={!canAddToCart}
                className="h-12 flex-1 rounded-2xl bg-black text-white font-semibold tracking-[0.18em] uppercase text-[12px] hover:bg-ink transition-colors disabled:opacity-50"
              >
                Dodaj do koszyka
              </button>
            </div>

            <div className="mt-8 rounded-2xl border border-black/10 bg-white p-5">
              <p className="text-sm text-black/70">
                Ten sam produkt w różnych wariantach dodajemy do koszyka jako osobne pozycje.
              </p>
            </div>
          </div>
        </div>

        {similar.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">Podobne produkty</h2>
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {similar.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
