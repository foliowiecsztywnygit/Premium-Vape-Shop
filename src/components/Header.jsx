import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Menu, Search, ShoppingBag, X } from 'lucide-react'
import { BUSINESS, getOpenStatus } from '../config/business'
import { useCartStore } from '../store/cartStore'
import { getCategories } from '../api/catalog'
import Logo from '../assets/brand/logo.png'

function getLabels(lang) {
  const isPl = (lang ?? '').startsWith('pl')
  return isPl
    ? {
        home: 'Home',
        shop: 'Sklep',
        promos: 'Promocje',
        about: 'O nas',
        contact: 'Kontakt',
        search: 'Szukaj',
        cart: 'Koszyk',
      }
    : {
        home: 'Home',
        shop: 'Shop',
        promos: 'Promotions',
        about: 'About',
        contact: 'Contact',
        search: 'Search',
        cart: 'Cart',
      }
}

export default function Header() {
  const { i18n } = useTranslation()
  const labels = useMemo(() => getLabels(i18n.language), [i18n.language])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [shopOpen, setShopOpen] = useState(false)
  const [status, setStatus] = useState(() => getOpenStatus())
  const [catalogCategories, setCatalogCategories] = useState([])
  const shopMenuRef = useRef(null)

  const cartItemsCount = useCartStore((state) => state.items.reduce((acc, item) => acc + item.quantity, 0))
  const openCart = useCartStore((state) => state.openCart)

  useEffect(() => {
    const id = setInterval(() => setStatus(getOpenStatus()), 30_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    let mounted = true
    getCategories()
      .then((data) => {
        if (!mounted) return
        setCatalogCategories(Array.isArray(data?.categories) ? data.categories : [])
      })
      .catch(() => {
        if (!mounted) return
        setCatalogCategories([])
      })
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!shopOpen) return
    const onPointerDown = (e) => {
      const el = shopMenuRef.current
      if (!el) return
      if (!el.contains(e.target)) setShopOpen(false)
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setShopOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [shopOpen])

  const toggleLanguage = () => {
    const next = (i18n.language ?? '').startsWith('pl') ? 'en' : 'pl'
    i18n.changeLanguage(next)
  }

  const navigateToSection = (e, sectionId) => {
    if (window.location.pathname !== '/') {
      window.location.href = sectionId === 'top' ? '/' : `/#${sectionId}`
      return
    }

    e?.preventDefault?.()
    setMobileMenuOpen(false)
    setShopOpen(false)

    if (sectionId === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    const el = document.getElementById(sectionId)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="fixed top-0 left-0 w-full z-50">
      <div className="bg-ink/75 backdrop-blur-xl border-b border-white/10">
        <div className="h-[2px] w-full bg-gradient-to-r from-accent-deep via-accent-tertiary to-accent-cyan opacity-90" />

        <div className="max-w-[1800px] mx-auto px-fluid-sm">
          <div className="hidden md:flex items-center justify-between py-2 text-[11px] tracking-[0.22em] uppercase text-white/70">
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-2 ${status.isOpen ? 'text-white' : 'text-white/60'}`}>
                <span className={`h-2 w-2 rounded-full ${status.isOpen ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                {status.label}
              </span>
              <span className="text-white/30">•</span>
              <span>
                {BUSINESS.googleRating.rating.toFixed(1)}/5 na podstawie {BUSINESS.googleRating.reviewsCount} opinii
              </span>
            </div>
            <div className="flex items-center gap-3">
              <a className="hover:text-accent-cyan transition-colors" href={`tel:${BUSINESS.phone.replace(/\s/g, '')}`}>
                {BUSINESS.phone}
              </a>
              <span className="text-white/30">•</span>
              <span>
                {BUSINESS.addressLine1}, {BUSINESS.addressLine2}
              </span>
            </div>
          </div>

          <header className="py-4 lg:py-5 flex items-center justify-between text-white">
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="lg:hidden p-2 rounded-xl hover:bg-white/5 transition-colors"
                aria-label="Menu"
                onClick={() => setMobileMenuOpen((v) => !v)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>

              <div className="hidden lg:flex items-center gap-3">
                <a
                  href={BUSINESS.social.facebook}
                  className="p-2 rounded-xl hover:bg-white/5 hover:text-accent-cyan transition-colors"
                  aria-label="Facebook"
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                    <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H8v-2.9h2.4V9.8c0-2.4 1.4-3.7 3.6-3.7 1 0 2.1.2 2.1.2v2.3H15c-1.2 0-1.6.7-1.6 1.5v1.8H16l-.4 2.9h-2.2v7A10 10 0 0 0 22 12Z" />
                  </svg>
                </a>
                <a
                  href={BUSINESS.social.instagram}
                  className="p-2 rounded-xl hover:bg-white/5 hover:text-accent-cyan transition-colors"
                  aria-label="Instagram"
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                    <path d="M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4A5.8 5.8 0 0 1 16.2 22H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2Zm-.2 2A3.6 3.6 0 0 0 4 7.6v8.8A3.6 3.6 0 0 0 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6A3.6 3.6 0 0 0 16.4 4H7.6Zm10.9 1.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
                  </svg>
                </a>
              </div>
            </div>

            <a
              href="/"
              onClick={(e) => navigateToSection(e, 'top')}
              className="relative flex items-center justify-center"
              aria-label={BUSINESS.name}
            >
              <div className="relative h-11 w-11 rounded-full bg-ink/70 backdrop-blur ring-1 ring-white/15 shadow-cyan-glow flex items-center justify-center">
                <img
                  src={Logo}
                  alt={`${BUSINESS.name} logo`}
                  className="h-9 w-9 object-contain"
                  draggable="false"
                  loading="eager"
                />
              </div>
            </a>

            <div className="flex items-center gap-2 lg:gap-3">
              <nav className="hidden lg:flex items-center gap-7 text-[13px] tracking-[0.18em] uppercase font-semibold">
                <a
                  href="/"
                  onClick={(e) => navigateToSection(e, 'top')}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  {labels.home}
                </a>

                <div className="relative" ref={shopMenuRef}>
                  <button
                    type="button"
                    className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
                    aria-haspopup="menu"
                    aria-expanded={shopOpen}
                    onClick={() => setShopOpen((v) => !v)}
                  >
                    {labels.shop}
                    <ChevronDown className={`h-4 w-4 transition-transform ${shopOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {shopOpen && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-[680px] p-4 rounded-2xl bg-ink/95 backdrop-blur-xl border border-white/10 shadow-2xl">
                      <div className="grid grid-cols-3 gap-2">
                        {catalogCategories.map((category) => (
                          <a
                            key={category.id}
                            href={`/shop/${category.slug}`}
                            onClick={() => setShopOpen(false)}
                            className="px-4 py-3 rounded-xl hover:bg-white/5 hover:text-accent-cyan transition-colors text-[12px] tracking-[0.12em] uppercase text-white/75"
                          >
                            {category.name}
                          </a>
                        ))}
                        {catalogCategories.length === 0 && (
                          <div className="col-span-3 px-4 py-3 rounded-xl bg-white/5 text-[12px] tracking-[0.12em] uppercase text-white/60">
                            Brak kategorii
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <a
                  href="/#promocje"
                  onClick={(e) => navigateToSection(e, 'promocje')}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  {labels.promos}
                </a>
                <a
                  href="/#onas"
                  onClick={(e) => navigateToSection(e, 'onas')}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  {labels.about}
                </a>
                <a
                  href="/#kontakt"
                  onClick={(e) => navigateToSection(e, 'kontakt')}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  {labels.contact}
                </a>
              </nav>

              <button
                type="button"
                className="hidden sm:inline-flex items-center justify-center px-3 h-9 rounded-xl border border-white/10 hover:border-accent-cyan/50 hover:text-accent-cyan transition-colors text-[11px] tracking-[0.22em] uppercase"
                onClick={toggleLanguage}
              >
                {(i18n.language ?? '').startsWith('pl') ? 'EN' : 'PL'}
              </button>

              <button
                type="button"
                className="p-2 rounded-xl hover:bg-white/5 hover:text-accent-cyan transition-colors"
                aria-label={labels.search}
              >
                <Search className="h-5 w-5" />
              </button>

              <button
                type="button"
                className="relative p-2 rounded-xl hover:bg-white/5 hover:text-accent-cyan transition-colors"
                aria-label={labels.cart}
                onClick={openCart}
              >
                <ShoppingBag className="h-5 w-5" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-[18px] min-w-[18px] px-1 rounded-full bg-accent-cyan text-black text-[10px] font-black flex items-center justify-center shadow-cyan-glow">
                    {cartItemsCount}
                  </span>
                )}
              </button>
            </div>
          </header>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-white/10 bg-ink/95 backdrop-blur-xl">
            <div className="max-w-[1800px] mx-auto px-fluid-sm py-4">
              <div className="flex items-center justify-between py-2 text-[11px] tracking-[0.22em] uppercase text-white/70">
                <span className="inline-flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${status.isOpen ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                  {status.label}
                </span>
                <a className="hover:text-accent-cyan transition-colors" href={`tel:${BUSINESS.phone.replace(/\s/g, '')}`}>
                  {BUSINESS.phone}
                </a>
              </div>

              <div className="mt-4 grid gap-2">
                <a
                  href="/"
                  onClick={(e) => navigateToSection(e, 'top')}
                  className="px-4 py-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors tracking-[0.16em] uppercase text-[12px]"
                >
                  {labels.home}
                </a>

                <button
                  type="button"
                  className="w-full flex items-center justify-between px-4 py-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors tracking-[0.16em] uppercase text-[12px]"
                  onClick={() => setShopOpen((v) => !v)}
                >
                  {labels.shop}
                  <ChevronDown className={`h-5 w-5 transition-transform ${shopOpen ? 'rotate-180' : ''}`} />
                </button>

                {shopOpen && (
                  <div className="grid grid-cols-2 gap-2">
                    {catalogCategories.map((category) => (
                      <a
                        key={category.id}
                        href={`/shop/${category.slug}`}
                        onClick={() => {
                          setMobileMenuOpen(false)
                          setShopOpen(false)
                        }}
                        className="px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors text-[11px] tracking-[0.12em] uppercase text-white/80"
                      >
                        {category.name}
                      </a>
                    ))}
                    {catalogCategories.length === 0 && (
                      <div className="col-span-2 px-4 py-3 rounded-2xl bg-white/5 text-[11px] tracking-[0.12em] uppercase text-white/60">
                        Brak kategorii
                      </div>
                    )}
                  </div>
                )}

                <a
                  href="/#promocje"
                  onClick={(e) => navigateToSection(e, 'promocje')}
                  className="px-4 py-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors tracking-[0.16em] uppercase text-[12px]"
                >
                  {labels.promos}
                </a>
                <a
                  href="/#onas"
                  onClick={(e) => navigateToSection(e, 'onas')}
                  className="px-4 py-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors tracking-[0.16em] uppercase text-[12px]"
                >
                  {labels.about}
                </a>
                <a
                  href="/#kontakt"
                  onClick={(e) => navigateToSection(e, 'kontakt')}
                  className="px-4 py-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors tracking-[0.16em] uppercase text-[12px]"
                >
                  {labels.contact}
                </a>
              </div>

              <div className="mt-5 flex items-center gap-2">
                <a
                  href={BUSINESS.social.facebook}
                  className="flex-1 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors text-[11px] tracking-[0.16em] uppercase text-center"
                  target="_blank"
                  rel="noreferrer"
                >
                  Facebook
                </a>
                <a
                  href={BUSINESS.social.instagram}
                  className="flex-1 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors text-[11px] tracking-[0.16em] uppercase text-center"
                  target="_blank"
                  rel="noreferrer"
                >
                  Instagram
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
