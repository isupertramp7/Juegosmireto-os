import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { BlockedDay, Inflatable } from '../types'
import { fetchBlockedDays, fetchInflatables } from '../lib/api'
import { isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { todayKey } from '../utils/date'
import { Logo } from '../components/Logo'
import { LoginForm } from '../components/admin/LoginForm'
import { AdminBookings } from '../components/admin/AdminBookings'
import { AdminInflatables } from '../components/admin/AdminInflatables'
import { AdminBlockedDays } from '../components/admin/AdminBlockedDays'
import { SetupNotice } from '../components/SetupNotice'

type Tab = 'reservas' | 'juegos' | 'dias'

const TABS: { id: Tab; label: string }[] = [
  { id: 'reservas', label: 'Reservas' },
  { id: 'juegos', label: 'Juegos' },
  { id: 'dias', label: 'Días bloqueados' },
]

export default function Admin() {
  const { session, isAdmin, loading, signIn, signOut } = useAuth()
  const [tab, setTab] = useState<Tab>('reservas')
  const [catalog, setCatalog] = useState<Inflatable[]>([])
  const [blockedDays, setBlockedDays] = useState<BlockedDay[]>([])

  // El admin ve también los juegos ocultos, por eso pide el catálogo completo.
  const loadCatalog = useCallback(async () => {
    const [items, blocked] = await Promise.all([
      fetchInflatables(true),
      fetchBlockedDays(todayKey()),
    ])
    setCatalog(items)
    setBlockedDays(blocked)
  }, [])

  useEffect(() => {
    if (isAdmin) void loadCatalog()
  }, [isAdmin, loadCatalog])

  if (!isSupabaseConfigured) return <SetupNotice />

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-tinta text-crema">
        <p className="animate-pulse font-bold">Cargando…</p>
      </div>
    )
  }

  if (!session) return <LoginForm onSignIn={signIn} />

  if (!isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-tinta p-6">
        <div className="max-w-md rounded-3xl bg-crema p-8 text-center shadow-2xl">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-tinta">
            Esta cuenta no es administradora
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-tinta-media">
            Tu usuario existe pero no está en la tabla{' '}
            <code className="rounded bg-arena px-1">admins</code>. Ejecuta{' '}
            <code className="rounded bg-arena px-1">
              supabase/migrations/0002_agregar_admin.sql
            </code>{' '}
            con tu correo y vuelve a entrar.
          </p>
          <button
            type="button"
            onClick={() => void signOut()}
            className="mt-6 rounded-full bg-tinta px-6 py-3 font-bold text-crema"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-arena/60">
      <header className="border-b border-arena-oscura bg-crema">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <Logo size={40} className="shrink-0" />
          <div className="mr-auto">
            <p className="font-[family-name:var(--font-display)] text-lg font-semibold leading-tight text-tinta">
              Panel de administración
            </p>
            <p className="text-xs text-tinta-media">{session.user.email}</p>
          </div>
          <Link
            to="/"
            className="rounded-full border-2 border-arena-oscura px-4 py-2 text-sm font-bold text-tinta transition hover:border-terracota hover:text-terracota"
          >
            Ver sitio
          </Link>
          <button
            type="button"
            onClick={() => void signOut()}
            className="rounded-full bg-tinta px-4 py-2 text-sm font-bold text-crema transition hover:bg-terracota"
          >
            Salir
          </button>
        </div>

        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`-mb-px whitespace-nowrap border-b-2 px-4 py-3 text-sm font-bold transition ${
                tab === item.id
                  ? 'border-terracota text-terracota'
                  : 'border-transparent text-tinta-media hover:text-tinta'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {tab === 'reservas' && <AdminBookings catalog={catalog} />}
        {tab === 'juegos' && (
          <AdminInflatables catalog={catalog} onSaved={loadCatalog} />
        )}
        {tab === 'dias' && (
          <AdminBlockedDays blockedDays={blockedDays} onChanged={loadCatalog} />
        )}
      </main>
    </div>
  )
}
