import { useMemo, useState } from 'react'
import type { Inflatable } from '../types'
import type { AvailabilityMap } from '../lib/api'
import { dayAvailability } from '../utils/availability'
import {
  MONTH_NAMES,
  WEEKDAY_SHORT,
  isPast,
  isToday,
  monthGrid,
  todayKey,
} from '../utils/date'

interface Props {
  catalog: Inflatable[]
  availability: AvailabilityMap
  blockedSet: Set<string>
  selectedDate: string
  onSelectDate: (date: string) => void
}

const LEGEND = [
  { color: 'bg-salvia', label: 'Todo disponible' },
  { color: 'bg-mostaza', label: 'Quedan pocos' },
  { color: 'bg-terracota', label: 'Sin cupo' },
  { color: 'bg-arena-oscura', label: 'No atendemos' },
]

export function Calendar({
  catalog,
  availability,
  blockedSet,
  selectedDate,
  onSelectDate,
}: Props) {
  const now = new Date()
  const [cursor, setCursor] = useState({
    year: now.getFullYear(),
    month: now.getMonth(),
  })

  const cells = useMemo(
    () => monthGrid(cursor.year, cursor.month),
    [cursor.year, cursor.month],
  )

  // No dejamos navegar a meses ya terminados.
  const atFirstMonth =
    cursor.year === now.getFullYear() && cursor.month === now.getMonth()

  function shiftMonth(delta: number) {
    setCursor((prev) => {
      const date = new Date(prev.year, prev.month + delta, 1)
      return { year: date.getFullYear(), month: date.getMonth() }
    })
  }

  return (
    <div className="rounded-3xl border border-arena-oscura/50 bg-crema p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          disabled={atFirstMonth}
          aria-label="Mes anterior"
          className="grid size-10 place-items-center rounded-xl border border-arena-oscura text-tinta-media transition hover:border-terracota hover:text-terracota disabled:cursor-not-allowed disabled:opacity-30"
        >
          ‹
        </button>

        <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-tinta first-letter:uppercase">
          {MONTH_NAMES[cursor.month]} {cursor.year}
        </h3>

        <button
          type="button"
          onClick={() => shiftMonth(1)}
          aria-label="Mes siguiente"
          className="grid size-10 place-items-center rounded-xl border border-arena-oscura text-tinta-media transition hover:border-terracota hover:text-terracota"
        >
          ›
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-xs font-bold uppercase text-tinta-suave">
        {WEEKDAY_SHORT.map((day) => (
          <span key={day} className="py-1">
            {day}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell) => {
          const past = isPast(cell.key)
          const blocked = blockedSet.has(cell.key)
          const disabled = past || blocked
          const { free, total } = dayAvailability(availability, catalog, cell.key)
          const selected = cell.key === selectedDate

          const dot = blocked
            ? 'bg-arena-oscura'
            : free === 0
              ? 'bg-terracota'
              : free < total
                ? 'bg-mostaza'
                : 'bg-salvia'

          return (
            <button
              key={cell.key}
              type="button"
              disabled={disabled}
              onClick={() => onSelectDate(cell.key)}
              aria-current={selected ? 'date' : undefined}
              title={blocked ? 'Ese día no atendemos' : undefined}
              className={[
                'relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm font-bold transition',
                past ? 'cursor-not-allowed text-arena-oscura' : '',
                blocked && !past
                  ? 'cursor-not-allowed text-tinta-suave line-through'
                  : '',
                !disabled ? 'hover:bg-arena' : '',
                !cell.inCurrentMonth && !disabled ? 'text-tinta-suave' : '',
                cell.inCurrentMonth && !disabled ? 'text-tinta' : '',
                selected
                  ? 'bg-terracota text-crema shadow-md shadow-terracota-claro/50 hover:bg-terracota'
                  : '',
                isToday(cell.key) && !selected
                  ? 'ring-2 ring-inset ring-terracota-claro'
                  : '',
              ].join(' ')}
            >
              <span>{cell.day}</span>
              {!past && (
                <span
                  className={`mt-0.5 size-1.5 rounded-full ${
                    selected ? 'bg-crema' : dot
                  }`}
                />
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-arena-oscura/50 pt-4 text-xs text-tinta-media">
        {LEGEND.map((item) => (
          <span key={item.label} className="flex items-center gap-1.5">
            <span className={`size-2 rounded-full ${item.color}`} />
            {item.label}
          </span>
        ))}
        <button
          type="button"
          onClick={() => {
            const today = new Date()
            setCursor({ year: today.getFullYear(), month: today.getMonth() })
            onSelectDate(todayKey())
          }}
          className="ml-auto font-bold text-terracota hover:underline"
        >
          Ir a hoy
        </button>
      </div>
    </div>
  )
}
