export const MONTH_NAMES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

/** Encabezados del calendario, con la semana partiendo en lunes. */
export const WEEKDAY_SHORT = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']

const WEEKDAY_NAMES = [
  'domingo',
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
]

/**
 * Convierte un Date local a la clave YYYY-MM-DD que usamos en todo el
 * proyecto. Trabajamos con strings para evitar corrimientos de zona horaria.
 */
export function toKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Convierte una clave YYYY-MM-DD en un Date al mediodía local. */
export function fromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}

export function todayKey(): string {
  return toKey(new Date())
}

/** Suma días a una clave YYYY-MM-DD y devuelve otra clave. */
export function addDays(key: string, days: number): string {
  const date = fromKey(key)
  date.setDate(date.getDate() + days)
  return toKey(date)
}

export function isPast(key: string): boolean {
  return key < todayKey()
}

export function isToday(key: string): boolean {
  return key === todayKey()
}

export interface CalendarCell {
  key: string
  day: number
  inCurrentMonth: boolean
}

/**
 * Genera la grilla del mes: siempre 6 filas de 7 días, rellenando con los
 * días vecinos para que el calendario no cambie de alto al navegar.
 */
export function monthGrid(year: number, month: number): CalendarCell[] {
  const first = new Date(year, month, 1)
  // getDay() entrega 0 = domingo; lo rotamos para que lunes sea 0.
  const offset = (first.getDay() + 6) % 7

  const cells: CalendarCell[] = []
  for (let i = 0; i < 42; i++) {
    const date = new Date(year, month, 1 - offset + i)
    cells.push({
      key: toKey(date),
      day: date.getDate(),
      inCurrentMonth: date.getMonth() === month,
    })
  }
  return cells
}

/** "sábado 5 de octubre de 2026" */
export function formatLong(key: string): string {
  const date = fromKey(key)
  return `${WEEKDAY_NAMES[date.getDay()]} ${date.getDate()} de ${
    MONTH_NAMES[date.getMonth()]
  } de ${date.getFullYear()}`
}

/** "sáb 5 oct" */
export function formatShort(key: string): string {
  const date = fromKey(key)
  return `${WEEKDAY_NAMES[date.getDay()].slice(0, 3)} ${date.getDate()} ${MONTH_NAMES[
    date.getMonth()
  ].slice(0, 3)}`
}

export function money(value: number): string {
  return `$${value.toLocaleString('es-CL')}`
}
