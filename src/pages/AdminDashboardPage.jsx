import React from 'react'
import BookingsFeed from '../components/admin/BookingsFeed'

export default function AdminDashboardPage() {
  const isAuthed = !!localStorage.getItem('pvs-admin-token')

  if (!isAuthed) {
    return (
      <div className="min-h-screen pt-28 lg:pt-32 pb-20 bg-paper text-black">
        <div className="max-w-[1200px] mx-auto px-fluid-sm">
          <div className="rounded-2xl border border-black/10 bg-white p-6">
            <h1 className="text-2xl font-black tracking-tight">Brak dostępu</h1>
            <p className="mt-3 text-black/70">Zaloguj się w panelu, aby zobaczyć dashboard rezerwacji.</p>
            <a
              href="/admin"
              className="mt-6 inline-flex h-12 items-center justify-center px-7 rounded-2xl bg-ink text-white font-semibold tracking-[0.18em] uppercase text-[12px] hover:bg-accent-deep transition-colors"
            >
              Przejdź do logowania
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-28 lg:pt-32 pb-20 bg-paper text-black">
      <div className="max-w-[1400px] mx-auto px-fluid-sm">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-accent-cyan text-xs font-semibold tracking-[0.22em] uppercase">Panel</p>
            <h1 className="mt-2 text-4xl md:text-5xl font-black tracking-tight">Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/admin"
              className="text-[12px] tracking-[0.22em] uppercase text-black/60 hover:text-black"
            >
              Produkty i kategorie
            </a>
            <a
              href="/"
              className="text-[12px] tracking-[0.22em] uppercase text-black/60 hover:text-black"
            >
              Sklep
            </a>
          </div>
        </div>

        <div className="mt-8">
          <BookingsFeed />
        </div>
      </div>
    </div>
  )
}

