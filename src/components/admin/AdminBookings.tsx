import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Booking, BookingStatus, Inflatable } from '../../types'
import { SLOT_BY_ID } from '../../data/catalog'
import {
  deleteBooking,
  fetchBookings,
  updateBookingStatus,
} from '../../lib/api'
import { supabase } from '../../lib/supabase'
import { formatShort, money, todayKey } from '../../utils/date'

interface Props {
  catalog: Inflatable[]
}

type Filter = 'proximas' | 'todas' | BookingStatus

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'proximas', label: 'Próximas' },
  { id: 'pendiente', label: 'Pendientes' },
  { id: 'confirmada', label: 'Confirmadas' },
  { id: 'cancelada', label: 'Canceladas' },
  { id: 'todas', label: 'Todas' },
]

const STATUS_STYLE: Record<BookingStatus, string> = {
  pendiente: 'bg-mostaza-claro text-tinta',
  confirmada: 'bg-salvia-pastel text-tinta',
  cancelada: 'bg-arena-oscura text-tinta-media',
}

export function AdminBookings({ catalog }: Props) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('proximas')
  const [search, setSearch] = useState('')
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const itemById = useMemo(() => {
    const map = new Map<string, Inflatable>()
    for (const item of catalog) map.set(item.id, item)
    return map
  }, [catalog])

  const load = useCallback(async () => {
    try {
      setError(null)
      setBookings(await fetchBookings())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar reservas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()

    // Realtime: si entra una reserva mientras tienes el panel abierto, aparece
    // sola sin tener que recargar.
    const channel = supabase
      .channel('admin-bookings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => void load(),
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [load])

  const visible = useMemo(() => {
    const today = todayKey()
    const term = search.trim().toLowerCase()

    return bookings
      .filter((b) => {
        if (filter === 'proximas') {
          return b.status !== 'cancelada' && b.date >= today
        }
        if (filter !== 'todas') return b.status === filter
        return true
      })
      .filter((b) => {
        if (!term) return true
        return [
          b.code,
          b.customer.name,
          b.customer.phone,
          b.customer.address,
          itemById.get(b.inflatableId)?.name ?? '',
        ]
          .join(' ')
          .toLowerCase()
          .includes(term)
      })
  }, [bookings, filter, search, itemById])

  const stats = useMemo(() => {
    const today = todayKey()
    return {
      proximas: bookings.filter(
        (b) => b.status !== 'cancelada' && b.date >= today,
      ).length,
      pendientes: bookings.filter((b) => b.status === 'pendiente').length,
      confirmadas: bookings.filter((b) => b.status === 'confirmada').length,
      ingresos: bookings
        .filter((b) => b.status === 'confirmada')
        .reduce((sum, b) => sum + b.total, 0),
    }
  }, [bookings])

  async function changeStatus(id: string, status: BookingStatus) {
    setBusyId(id)
    try {
      await updateBookingStatus(id, status)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar')
    } finally {
      setBusyId(null)
    }
  }

  async function remove(id: string) {
    setBusyId(id)
    try {
      await deleteBooking(id)
      setPendingDelete(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo borrar')
    } finally {
      setBusyId(null)
    }
  }

  function downloadCsv() {
    const header = [
      'codigo',
      'fecha',
      'bloque',
      'juego',
      'cliente',
      'telefono',
      'email',
      'direccion',
      'comentarios',
      'estado',
      'total',
    ]
    const rows = visible.map((b) => [
      b.code,
      b.date,
      SLOT_BY_ID[b.slot].label,
      itemById.get(b.inflatableId)?.name ?? b.inflatableId,
      b.customer.name,
      b.customer.phone,
      b.customer.email,
      b.customer.address,
      b.customer.notes.replace(/\n/g, ' '),
      b.status,
      String(b.total),
    ])
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n')

    // El BOM hace que Excel abra bien los acentos.
    const url = URL.createObjectURL(
      new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }),
    )
    const link = document.createElement('a')
    link.href = url
    link.download = `reservas-${todayKey()}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Próximas" value={String(stats.proximas)} />
        <StatCard label="Pendientes" value={String(stats.pendientes)} />
        <StatCard label="Confirmadas" value={String(stats.confirmadas)} />
        <StatCard label="Ingreso confirmado" value={money(stats.ingresos)} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              filter === item.id
                ? 'bg-tinta text-crema'
                : 'bg-crema text-tinta-media ring-1 ring-arena-oscura hover:ring-terracota'
            }`}
          >
            {item.label}
          </button>
        ))}

        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por código, nombre, teléfono…"
          className="ml-auto w-full max-w-xs rounded-full border border-arena-oscura bg-crema px-4 py-2 text-sm outline-none transition focus:border-terracota focus:ring-2 focus:ring-terracota-pastel"
        />
        <button
          type="button"
          onClick={downloadCsv}
          disabled={visible.length === 0}
          className="rounded-full border-2 border-arena-oscura px-4 py-2 text-sm font-bold text-tinta transition hover:border-terracota hover:text-terracota disabled:opacity-40"
        >
          CSV
        </button>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-full border-2 border-arena-oscura px-4 py-2 text-sm font-bold text-tinta transition hover:border-terracota hover:text-terracota"
        >
          Refrescar
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-2xl bg-terracota-pastel p-4 text-sm font-semibold text-terracota-oscuro"
        >
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-arena" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-arena-oscura bg-crema p-10 text-center">
          <p className="font-bold text-tinta">No hay reservas con este filtro</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((booking) => {
            const item = itemById.get(booking.inflatableId)
            const slot = SLOT_BY_ID[booking.slot]
            const past = booking.date < todayKey()
            const busy = busyId === booking.id

            return (
              <li
                key={booking.id}
                className={`rounded-2xl border border-arena-oscura/60 bg-crema p-4 shadow-sm transition ${
                  booking.status === 'cancelada' ? 'opacity-60' : ''
                } ${busy ? 'opacity-50' : ''}`}
              >
                <div className="flex flex-wrap items-start gap-4">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="grid shrink-0 place-items-center rounded-xl bg-tinta px-3 py-2 text-center text-crema">
                      <span className="text-[11px] font-bold uppercase leading-tight">
                        {formatShort(booking.date)}
                      </span>
                      <span className="text-[10px] text-arena/70">
                        {slot.hours}
                      </span>
                    </div>

                    <span
                      className={`grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-2xl ${
                        item?.gradient ?? 'from-arena to-arena-oscura'
                      }`}
                    >
                      {item?.emoji ?? '·'}
                    </span>

                    <div className="min-w-0">
                      <p className="truncate font-bold text-tinta">
                        {item?.name ?? booking.inflatableId}{' '}
                        <span className="font-normal text-tinta-suave">
                          · {slot.label}
                        </span>
                      </p>
                      <p className="truncate text-sm text-tinta-media">
                        {booking.customer.name} ·{' '}
                        <a
                          href={`tel:${booking.customer.phone}`}
                          className="hover:text-terracota"
                        >
                          {booking.customer.phone}
                        </a>
                        {booking.customer.email && ` · ${booking.customer.email}`}
                      </p>
                      <p className="truncate text-xs text-tinta-suave">
                        {booking.customer.address}
                        {booking.customer.notes &&
                          ` — ${booking.customer.notes}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-[family-name:var(--font-display)] text-lg font-semibold text-tinta">
                      {booking.total > 0 ? money(booking.total) : 'Sin precio'}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                        STATUS_STYLE[booking.status]
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-arena-oscura/60 pt-3 text-xs">
                  <span className="mr-auto font-mono text-tinta-suave">
                    #{booking.code}
                    {past && ' · ya pasó'}
                  </span>

                  <a
                    href={`https://wa.me/${booking.customer.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-salvia-pastel px-3.5 py-1.5 font-bold text-tinta transition hover:brightness-95"
                  >
                    WhatsApp
                  </a>

                  {booking.status !== 'confirmada' && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void changeStatus(booking.id, 'confirmada')}
                      className="rounded-full bg-salvia px-3.5 py-1.5 font-bold text-crema transition hover:brightness-95"
                    >
                      Confirmar
                    </button>
                  )}
                  {booking.status !== 'cancelada' && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void changeStatus(booking.id, 'cancelada')}
                      className="rounded-full bg-arena px-3.5 py-1.5 font-bold text-tinta-media transition hover:bg-arena-oscura"
                    >
                      Cancelar
                    </button>
                  )}
                  {booking.status === 'cancelada' && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void changeStatus(booking.id, 'pendiente')}
                      className="rounded-full bg-mostaza-claro px-3.5 py-1.5 font-bold text-tinta transition hover:brightness-95"
                    >
                      Reactivar
                    </button>
                  )}

                  {pendingDelete === booking.id ? (
                    <span className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void remove(booking.id)}
                        className="rounded-full bg-terracota-oscuro px-3.5 py-1.5 font-bold text-crema"
                      >
                        Sí, borrar
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(null)}
                        className="rounded-full px-2 py-1.5 font-bold text-tinta-media hover:underline"
                      >
                        No
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPendingDelete(booking.id)}
                      className="rounded-full px-3 py-1.5 font-bold text-tinta-suave transition hover:text-terracota"
                    >
                      Borrar
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-arena-oscura/60 bg-crema p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-tinta-suave">
        {label}
      </p>
      <p className="font-[family-name:var(--font-display)] text-2xl font-semibold text-tinta">
        {value}
      </p>
    </div>
  )
}
