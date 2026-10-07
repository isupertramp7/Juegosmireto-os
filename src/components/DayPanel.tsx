import type { Inflatable, SlotId } from '../types'
import type { AvailabilityMap } from '../lib/api'
import { SLOTS } from '../data/catalog'
import { remainingUnits } from '../utils/availability'
import { formatLong, money } from '../utils/date'

interface Props {
  catalog: Inflatable[]
  availability: AvailabilityMap
  date: string
  blocked: boolean
  /** Juego preseleccionado desde el catálogo: se muestra primero. */
  highlightId: string | null
  onPick: (inflatableId: string, slot: SlotId) => void
}

export function DayPanel({
  catalog,
  availability,
  date,
  blocked,
  highlightId,
  onPick,
}: Props) {
  // El juego que viene del catálogo sube al tope de la lista.
  const items = [...catalog].sort((a, b) => {
    if (a.id === highlightId) return -1
    if (b.id === highlightId) return 1
    return 0
  })

  return (
    <div className="rounded-3xl border border-arena-oscura/50 bg-crema p-5 shadow-sm">
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-terracota">
          Disponibilidad del día
        </p>
        <h3 className="mt-1 font-[family-name:var(--font-display)] text-lg font-semibold text-tinta first-letter:uppercase">
          {formatLong(date)}
        </h3>
        <p className="mt-1 text-sm text-tinta-media">
          Elige un juego y su bloque horario para continuar con la reserva.
        </p>
      </div>

      {blocked ? (
        <div className="rounded-2xl border border-dashed border-arena-oscura bg-arena p-8 text-center">
          <p className="font-bold text-tinta">Ese día no estamos atendiendo</p>
          <p className="mt-1 text-sm text-tinta-media">
            Elige otra fecha en el calendario.
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-arena-oscura bg-arena p-8 text-center text-sm text-tinta-media">
          Todavía no hay juegos publicados en el catálogo.
        </div>
      ) : (
        <ul className="flex max-h-[29rem] flex-col gap-3 overflow-y-auto pr-1">
          {items.map((item) => {
            const highlighted = item.id === highlightId
            return (
              <li
                key={item.id}
                className={`rounded-2xl border p-3 transition ${
                  highlighted
                    ? 'border-terracota-claro bg-terracota-pastel ring-2 ring-terracota-claro'
                    : 'border-arena-oscura/50 bg-arena/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-2xl ${item.gradient}`}
                  >
                    {item.emoji}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-tinta">{item.name}</p>
                    <p className="truncate text-xs text-tinta-suave">
                      {item.size} · hasta {item.capacity} niños
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  {SLOTS.map((slot) => {
                    const left = remainingUnits(availability, item, date, slot.id)
                    const full = left <= 0
                    const price = item.prices[slot.id]
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={full}
                        onClick={() => onPick(item.id, slot.id)}
                        title={
                          full
                            ? `Sin cupo en ${slot.label.toLowerCase()}`
                            : `${slot.label} ${slot.hours}`
                        }
                        className={`rounded-xl border px-2 py-2 text-center transition ${
                          full
                            ? 'cursor-not-allowed border-arena-oscura bg-arena text-tinta-suave line-through'
                            : 'border-arena-oscura bg-crema text-tinta hover:border-terracota hover:bg-terracota-pastel hover:text-terracota'
                        }`}
                      >
                        <span className="block text-[11px] font-bold uppercase">
                          {slot.label}
                        </span>
                        <span className="block text-sm font-bold">
                          {price > 0 ? money(price) : 'Consultar'}
                        </span>
                        {!full && item.stock > 1 && (
                          <span className="block text-[10px] text-salvia">
                            {left} disponible{left === 1 ? '' : 's'}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
