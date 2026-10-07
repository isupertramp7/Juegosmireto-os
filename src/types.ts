/** Bloques horarios en que se arrienda un inflable. */
export type SlotId = 'manana' | 'tarde' | 'completo'

export interface SlotInfo {
  id: SlotId
  label: string
  hours: string
}

export interface Inflatable {
  id: string
  name: string
  tagline: string
  description: string
  /** Medidas aproximadas, ej. "4 x 4 x 3 m". */
  size: string
  /** Capacidad recomendada de niños a la vez. */
  capacity: number
  ageRange: string
  /** Precio por bloque horario, en pesos. */
  prices: Record<SlotId, number>
  emoji: string
  /** Clases de gradiente Tailwind para la portada de la tarjeta. */
  gradient: string
  features: string[]
  /** Unidades disponibles de este inflable. */
  stock: number
  active: boolean
  sortOrder: number
}

export type BookingStatus = 'pendiente' | 'confirmada' | 'cancelada'

export interface Customer {
  name: string
  phone: string
  email: string
  address: string
  notes: string
}

export interface Booking {
  id: string
  /** Código corto que ve el cliente, ej. "A3F19C2D". */
  code: string
  inflatableId: string
  /** Fecha en formato ISO corto: YYYY-MM-DD. */
  date: string
  slot: SlotId
  customer: Customer
  status: BookingStatus
  total: number
  createdAt: string
}

export interface BlockedDay {
  date: string
  reason: string
}

// --- Filas tal como vienen de Supabase --------------------------------------

export interface InflatableRow {
  id: string
  name: string
  tagline: string
  description: string
  size: string
  capacity: number
  age_range: string
  price_manana: number
  price_tarde: number
  price_completo: number
  emoji: string
  gradient: string
  features: string[]
  stock: number
  active: boolean
  sort_order: number
}

export interface BookingRow {
  id: string
  code: string
  inflatable_id: string
  date: string
  slot: SlotId
  customer_name: string
  customer_phone: string
  customer_email: string
  customer_address: string
  customer_notes: string
  status: BookingStatus
  total: number
  created_at: string
}

export interface AvailabilityRow {
  date: string
  inflatable_id: string
  slot: SlotId
  used: number
}
