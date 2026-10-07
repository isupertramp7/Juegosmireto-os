import { useState } from 'react'
import type { BlockedDay } from '../../types'
import { blockDay, unblockDay } from '../../lib/api'
import { formatLong, todayKey } from '../../utils/date'

interface Props {
  blockedDays: BlockedDay[]
  onChanged: () => Promise<void> | void
}

export function AdminBlockedDays({ blockedDays, onChanged }: Props) {
  const [date, setDate] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function add() {
    if (!date) {
      setError('Elige una fecha.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await blockDay(date, reason.trim())
      await onChanged()
      setDate('')
      setReason('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo bloquear el día')
    } finally {
      setBusy(false)
    }
  }

  async function remove(target: string) {
    setBusy(true)
    try {
      await unblockDay(target)
      await onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo liberar el día')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <p className="text-sm text-tinta-media">
        Los días bloqueados aparecen tachados en el calendario y la base rechaza
        cualquier reserva para esa fecha. Úsalo para vacaciones, feriados o
        mantención de los juegos.
      </p>

      <div className="mt-5 flex flex-wrap items-end gap-3 rounded-2xl border border-arena-oscura/60 bg-crema p-4 shadow-sm">
        <div>
          <label
            htmlFor="blocked-date"
            className="mb-1.5 block text-sm font-bold text-tinta"
          >
            Fecha
          </label>
          <input
            id="blocked-date"
            type="date"
            min={todayKey()}
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="rounded-xl border border-arena-oscura bg-crema px-3.5 py-2.5 text-sm outline-none focus:border-terracota focus:ring-2 focus:ring-terracota-pastel"
          />
        </div>
        <div className="min-w-48 flex-1">
          <label
            htmlFor="blocked-reason"
            className="mb-1.5 block text-sm font-bold text-tinta"
          >
            Motivo (opcional)
          </label>
          <input
            id="blocked-reason"
            type="text"
            value={reason}
            placeholder="Vacaciones, mantención…"
            onChange={(event) => setReason(event.target.value)}
            className="w-full rounded-xl border border-arena-oscura bg-crema px-3.5 py-2.5 text-sm outline-none focus:border-terracota focus:ring-2 focus:ring-terracota-pastel"
          />
        </div>
        <button
          type="button"
          onClick={() => void add()}
          disabled={busy}
          className="rounded-full bg-tinta px-5 py-2.5 text-sm font-bold text-crema transition hover:bg-terracota disabled:opacity-60"
        >
          Bloquear día
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-terracota-pastel p-3 text-sm font-semibold text-terracota-oscuro"
        >
          {error}
        </p>
      )}

      {blockedDays.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-arena-oscura p-8 text-center text-sm text-tinta-media">
          No hay días bloqueados. Atiendes todos los días.
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-2">
          {blockedDays.map((day) => (
            <li
              key={day.date}
              className="flex items-center gap-3 rounded-2xl border border-arena-oscura/60 bg-crema p-3 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-tinta first-letter:uppercase">
                  {formatLong(day.date)}
                </p>
                {day.reason && (
                  <p className="truncate text-xs text-tinta-media">
                    {day.reason}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => void remove(day.date)}
                disabled={busy}
                className="rounded-full px-3 py-1.5 text-xs font-bold text-tinta-suave transition hover:text-terracota"
              >
                Liberar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
