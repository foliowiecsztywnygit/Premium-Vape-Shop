import React, { useEffect, useMemo, useState } from 'react'
import {
  adminChangePassword,
  adminCreateCategory,
  adminCreateProduct,
  adminDeleteCategory,
  adminDeleteProduct,
  adminGetCategories,
  adminGetProducts,
  adminLogin,
  adminUpdateCategory,
  adminUpdateProduct,
} from '../api/admin'
import ManualInventory from '../components/admin/ManualInventory'

function slugify(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/(^-|-$)/g, '')
}

export default function AdminPage() {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [authError, setAuthError] = useState('')
  const [isAuthed, setIsAuthed] = useState(() => !!localStorage.getItem('pvs-admin-token'))
  const [password, setPassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const [newCategoryName, setNewCategoryName] = useState('')
  const [editCategoryId, setEditCategoryId] = useState('')
  const [editCategoryName, setEditCategoryName] = useState('')
  const [editCategorySlug, setEditCategorySlug] = useState('')
  const [newProductName, setNewProductName] = useState('')
  const [newProductSlug, setNewProductSlug] = useState('')
  const [newProductCategoryId, setNewProductCategoryId] = useState('')
  const [newProductPrice, setNewProductPrice] = useState('')
  const [newProductDescription, setNewProductDescription] = useState('')
  const [newProductImageUrl, setNewProductImageUrl] = useState('')
  const [newProductVariants, setNewProductVariants] = useState('')

  const refresh = () => {
    setLoading(true)
    setError('')
    Promise.all([adminGetCategories(), adminGetProducts()])
      .then(([c, p]) => {
        setCategories(Array.isArray(c?.categories) ? c.categories : [])
        setProducts(Array.isArray(p?.products) ? p.products : [])
        setLoading(false)
        setIsAuthed(true)
      })
      .catch((err) => {
        const msg = err?.message || 'Błąd ładowania'
        if (String(msg).toLowerCase().includes('unauthorized')) {
          setIsAuthed(false)
          setAuthError('Brak dostępu. Zaloguj się.')
        } else {
          setError(msg)
        }
        setLoading(false)
      })
  }

  useEffect(() => {
    if (isAuthed) refresh()
  }, [])

  useEffect(() => {
    if (!newProductSlug && newProductName) setNewProductSlug(slugify(newProductName))
  }, [newProductName, newProductSlug])

  const categoryOptions = useMemo(() => {
    return categories.filter((c) => c.active).map((c) => ({ id: c.id, label: c.name }))
  }, [categories])

  const doLogin = async (e) => {
    e.preventDefault()
    setAuthError('')
    try {
      const data = await adminLogin(password)
      localStorage.setItem('pvs-admin-token', data.token)
      setIsAuthed(true)
      setPassword('')
      refresh()
    } catch (err) {
      setIsAuthed(false)
      setAuthError(err?.message || 'Błędne hasło')
    }
  }

  const logout = () => {
    localStorage.removeItem('pvs-admin-token')
    setIsAuthed(false)
    setCategories([])
    setProducts([])
  }

  const changePassword = async (e) => {
    e.preventDefault()
    setError('')
    setAuthError('')
    try {
      const data = await adminChangePassword(currentPassword, newPassword)
      localStorage.setItem('pvs-admin-token', data.token)
      setCurrentPassword('')
      setNewPassword('')
      refresh()
    } catch (err) {
      setError(err?.message || 'Błąd zmiany hasła')
    }
  }

  const createCategory = async (e) => {
    e.preventDefault()
    setError('')
    const name = newCategoryName.trim()
    if (!name) return
    const slug = slugify(name)
    try {
      await adminCreateCategory({ name, slug })
      setNewCategoryName('')
      refresh()
    } catch (err) {
      setError(err?.message || 'Błąd tworzenia kategorii')
    }
  }

  const startEditCategory = (c) => {
    setEditCategoryId(c.id)
    setEditCategoryName(c.name || '')
    setEditCategorySlug(c.slug || '')
  }

  const cancelEditCategory = () => {
    setEditCategoryId('')
    setEditCategoryName('')
    setEditCategorySlug('')
  }

  const saveEditCategory = async (e) => {
    e.preventDefault()
    setError('')
    const name = editCategoryName.trim()
    const slug = (editCategorySlug || slugify(name)).trim()
    if (!editCategoryId || !name || !slug) return
    try {
      await adminUpdateCategory(editCategoryId, { name, slug })
      cancelEditCategory()
      refresh()
    } catch (err) {
      setError(err?.message || 'Błąd aktualizacji kategorii')
    }
  }

  const removeCategory = async (c) => {
    setError('')
    const ok = confirm(
      `Usunąć kategorię: ${c.name}?\n\nProdukty w tej kategorii zostaną odpięte (bez kategorii).`
    )
    if (!ok) return
    try {
      await adminDeleteCategory(c.id)
      if (editCategoryId === c.id) cancelEditCategory()
      refresh()
    } catch (err) {
      setError(err?.message || 'Błąd usuwania kategorii')
    }
  }

  const createProduct = async (e) => {
    e.preventDefault()
    setError('')
    const name = newProductName.trim()
    const slug = newProductSlug.trim() || slugify(name)
    const basePrice = Number(String(newProductPrice).replace(',', '.'))
    if (!name || !slug || !Number.isFinite(basePrice)) {
      setError('Uzupełnij nazwę, slug i cenę')
      return
    }

    const variants = newProductVariants
      .split('\n')
      .map((x) => x.trim())
      .filter(Boolean)
      .map((v) => ({ name: v }))

    const images = newProductImageUrl.trim() ? [{ url: newProductImageUrl.trim() }] : []

    try {
      await adminCreateProduct({
        name,
        slug,
        basePrice,
        currency: 'PLN',
        categoryId: newProductCategoryId || null,
        description: newProductDescription || null,
        images,
        variants,
      })
      setNewProductName('')
      setNewProductSlug('')
      setNewProductCategoryId('')
      setNewProductPrice('')
      setNewProductDescription('')
      setNewProductImageUrl('')
      setNewProductVariants('')
      refresh()
    } catch (err) {
      setError(err?.message || 'Błąd tworzenia produktu')
    }
  }

  const toggleActive = async (p) => {
    setError('')
    try {
      await adminUpdateProduct(p.id, { active: !p.active })
      refresh()
    } catch (err) {
      setError(err?.message || 'Błąd aktualizacji')
    }
  }

  const removeProduct = async (p) => {
    setError('')
    if (!confirm(`Usunąć produkt: ${p.name}?`)) return
    try {
      await adminDeleteProduct(p.id)
      refresh()
    } catch (err) {
      setError(err?.message || 'Błąd usuwania')
    }
  }

  return (
    <div className="min-h-screen pt-28 lg:pt-32 pb-20 bg-paper text-black">
      <div className="max-w-[1400px] mx-auto px-fluid-sm">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-accent-cyan text-xs font-semibold tracking-[0.22em] uppercase">Panel</p>
            <h1 className="mt-2 text-4xl md:text-5xl font-black tracking-tight">Administracja</h1>
          </div>
          <a href="/" className="text-[12px] tracking-[0.22em] uppercase text-black/60 hover:text-black">
            Powrót do sklepu
          </a>
        </div>

        {!isAuthed ? (
          <div className="mt-8 rounded-2xl border border-black/10 bg-white p-6">
            <h2 className="text-xl font-black tracking-tight">Logowanie</h2>
            <form className="mt-5 grid gap-3" onSubmit={doLogin}>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Hasło"
                type="password"
                className="h-12 px-4 rounded-2xl border border-black/10 focus:outline-none focus:border-accent-cyan"
              />
              <button
                type="submit"
                className="h-12 w-full rounded-2xl bg-black text-white text-[12px] tracking-[0.18em] uppercase font-semibold hover:bg-ink transition-colors"
              >
                Zaloguj
              </button>
              {authError && <div className="text-sm text-rose-600 font-semibold">{authError}</div>}
            </form>
            <div className="mt-4 text-xs tracking-[0.18em] uppercase text-black/50">
              Domyślne hasło: qwerty
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-6">
            <div className="rounded-2xl border border-black/10 bg-white p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-sm text-black/70">Zalogowano</div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={refresh}
                    className="h-11 px-4 rounded-2xl border border-black/10 text-[12px] tracking-[0.18em] uppercase font-semibold hover:border-accent-cyan/60 hover:text-accent-cyan transition-colors"
                  >
                    Odśwież
                  </button>
                  <button
                    type="button"
                    onClick={logout}
                    className="h-11 px-4 rounded-2xl bg-black text-white text-[12px] tracking-[0.18em] uppercase font-semibold hover:bg-ink transition-colors"
                  >
                    Wyloguj
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-6">
              <h2 className="text-xl font-black tracking-tight">Zmień hasło</h2>
              <form className="mt-5 grid gap-3" onSubmit={changePassword}>
                <input
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Obecne hasło"
                  type="password"
                  className="h-12 px-4 rounded-2xl border border-black/10 focus:outline-none focus:border-accent-cyan"
                />
                <input
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nowe hasło"
                  type="password"
                  className="h-12 px-4 rounded-2xl border border-black/10 focus:outline-none focus:border-accent-cyan"
                />
                <button
                  type="submit"
                  className="h-12 w-full rounded-2xl bg-black text-white text-[12px] tracking-[0.18em] uppercase font-semibold hover:bg-ink transition-colors"
                >
                  Zapisz nowe hasło
                </button>
              </form>
            </div>
          </div>
        )}

        {error && <div className="mt-6 text-sm text-rose-600 font-semibold">{error}</div>}

        {isAuthed && (
        <div className="mt-10 grid gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-black/10 bg-white p-6">
            <h2 className="text-xl font-black tracking-tight">Kategorie</h2>
            <form className="mt-5 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2" onSubmit={createCategory}>
              <input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nazwa kategorii (np. Liquidy)"
                className="flex-1 h-11 px-4 rounded-2xl border border-black/10 focus:outline-none focus:border-accent-cyan"
              />
              <button
                type="submit"
                className="h-11 w-full sm:w-auto px-4 rounded-2xl bg-black text-white text-[12px] tracking-[0.18em] uppercase font-semibold hover:bg-ink transition-colors"
              >
                Dodaj
              </button>
            </form>
            <div className="mt-5 grid gap-2">
              {categories.map((c) => (
                <div key={c.id} className="rounded-2xl border border-black/5 px-4 py-4">
                  {editCategoryId === c.id ? (
                    <form className="grid gap-2" onSubmit={saveEditCategory}>
                      <input
                        value={editCategoryName}
                        onChange={(e) => {
                          const v = e.target.value
                          setEditCategoryName(v)
                          setEditCategorySlug((s) => (s ? s : slugify(v)))
                        }}
                        placeholder="Nazwa kategorii"
                        className="h-11 px-4 rounded-2xl border border-black/10 focus:outline-none focus:border-accent-cyan"
                      />
                      <input
                        value={editCategorySlug}
                        onChange={(e) => setEditCategorySlug(e.target.value)}
                        placeholder="Slug (np. liquidy)"
                        className="h-11 px-4 rounded-2xl border border-black/10 focus:outline-none focus:border-accent-cyan"
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <button
                          type="submit"
                          className="h-11 w-full rounded-2xl bg-black text-white text-[12px] tracking-[0.18em] uppercase font-semibold hover:bg-ink transition-colors"
                        >
                          Zapisz
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditCategory}
                          className="h-11 w-full rounded-2xl border border-black/10 text-[12px] tracking-[0.18em] uppercase font-semibold hover:border-accent-cyan/60 hover:text-accent-cyan transition-colors"
                        >
                          Anuluj
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <div className="font-semibold">{c.name}</div>
                        <div className="text-xs tracking-[0.18em] uppercase text-black/50">
                          {c.slug} {c.active ? '' : '• nieaktywna'}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEditCategory(c)}
                          className="h-10 w-full sm:w-auto px-4 rounded-2xl border border-black/10 text-[12px] tracking-[0.18em] uppercase font-semibold hover:border-accent-cyan/60 hover:text-accent-cyan transition-colors"
                        >
                          Edytuj
                        </button>
                        <button
                          type="button"
                          onClick={() => removeCategory(c)}
                          className="h-10 w-full sm:w-auto px-4 rounded-2xl bg-black text-white text-[12px] tracking-[0.18em] uppercase font-semibold hover:bg-ink transition-colors"
                        >
                          Usuń
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {categories.length === 0 && <div className="text-sm text-black/60">Brak kategorii</div>}
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-6">
            <h2 className="text-xl font-black tracking-tight">Nowy produkt</h2>
            <form className="mt-5 grid gap-3" onSubmit={createProduct}>
              <input
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                placeholder="Nazwa produktu"
                className="h-11 px-4 rounded-2xl border border-black/10 focus:outline-none focus:border-accent-cyan"
              />
              <input
                value={newProductSlug}
                onChange={(e) => setNewProductSlug(e.target.value)}
                placeholder="Slug (np. longfill-monkey-splash)"
                className="h-11 px-4 rounded-2xl border border-black/10 focus:outline-none focus:border-accent-cyan"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={newProductCategoryId}
                  onChange={(e) => setNewProductCategoryId(e.target.value)}
                  className="h-11 px-4 rounded-2xl border border-black/10 bg-white focus:outline-none focus:border-accent-cyan"
                >
                  <option value="">Bez kategorii</option>
                  {categoryOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <input
                  value={newProductPrice}
                  onChange={(e) => setNewProductPrice(e.target.value)}
                  placeholder="Cena bazowa (np. 39,99)"
                  className="h-11 px-4 rounded-2xl border border-black/10 focus:outline-none focus:border-accent-cyan"
                />
              </div>
              <input
                value={newProductImageUrl}
                onChange={(e) => setNewProductImageUrl(e.target.value)}
                placeholder="URL zdjęcia (opcjonalnie)"
                className="h-11 px-4 rounded-2xl border border-black/10 focus:outline-none focus:border-accent-cyan"
              />
              <textarea
                value={newProductDescription}
                onChange={(e) => setNewProductDescription(e.target.value)}
                placeholder="Opis (opcjonalnie)"
                className="min-h-[90px] px-4 py-3 rounded-2xl border border-black/10 focus:outline-none focus:border-accent-cyan"
              />
              <textarea
                value={newProductVariants}
                onChange={(e) => setNewProductVariants(e.target.value)}
                placeholder={'Warianty (po 1 na linię)\nnp. agrest kiwi winogron\nbanan czereśnia ice'}
                className="min-h-[110px] px-4 py-3 rounded-2xl border border-black/10 focus:outline-none focus:border-accent-cyan"
              />
              <button
                type="submit"
                className="h-12 rounded-2xl bg-black text-white text-[12px] tracking-[0.18em] uppercase font-semibold hover:bg-ink transition-colors"
              >
                Utwórz produkt
              </button>
            </form>
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-6">
          <div className="flex items-end justify-between gap-6">
            <h2 className="text-xl font-black tracking-tight">Produkty</h2>
            <div className="text-xs tracking-[0.18em] uppercase text-black/50">
              {loading ? 'Ładowanie…' : `Łącznie: ${products.length}`}
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            {loading ? (
              <div className="text-sm text-black/60">Ładowanie…</div>
            ) : products.length === 0 ? (
              <div className="text-sm text-black/60">Brak produktów</div>
            ) : (
              products.map((p) => (
                <div key={p.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-2xl border border-black/5 px-4 py-4">
                  <div>
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-xs tracking-[0.18em] uppercase text-black/50">
                      {p.category?.name || 'Bez kategorii'} • {p.currency} {Number(p.basePrice).toFixed(2)}
                      {p.variants?.length ? ` • wariantów: ${p.variants.length}` : ''}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:flex sm:items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleActive(p)}
                      className="h-10 w-full sm:w-auto px-4 rounded-2xl border border-black/10 text-[12px] tracking-[0.18em] uppercase font-semibold hover:border-accent-cyan/60 hover:text-accent-cyan transition-colors"
                    >
                      {p.active ? 'Dezaktywuj' : 'Aktywuj'}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeProduct(p)}
                      className="h-10 w-full sm:w-auto px-4 rounded-2xl bg-black text-white text-[12px] tracking-[0.18em] uppercase font-semibold hover:bg-ink transition-colors"
                    >
                      Usuń
                    </button>
                    <a
                      href={`/product/${p.id}`}
                      className="h-10 w-full sm:w-auto px-4 inline-flex items-center justify-center rounded-2xl border border-black/10 text-[12px] tracking-[0.18em] uppercase font-semibold hover:border-accent-cyan/60 hover:text-accent-cyan transition-colors"
                    >
                      Podgląd
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <ManualInventory />
        </div>
        )}
      </div>
    </div>
  )
}
