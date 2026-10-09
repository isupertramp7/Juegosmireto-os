import { supabase } from './supabase'
import type {
  AvailabilityRow,
  BlockedDay,
  Booking,
  BookingRow,
  BookingStatus,
  Customer,
  Inflatable,
  InflatableRow,
  SlotId,
} from '../types'

// --- Conversión fila ⇄ modelo de la app -------------------------------------

export function rowToInflatable(row: InflatableRow): Inflatable {
  return {
    id: row.id,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    size: row.size,
    capacity: row.capacity,
    ageRange: row.age_range,
    prices: {
      manana: row.price_manana,
      tarde: row.price_tarde,
      completo: row.price_completo,
    },
    emoji: row.emoji,
    gradient: row.gradient,
    features: row.features ?? [],
    stock: row.stock,
    active: row.active,
    sortOrder: row.sort_order,
  }
}

export function inflatableToRow(item: Inflatable): InflatableRow {
  return {
    id: item.id,
    name: item.name,
    tagline: item.tagline,
    description: item.description,
    size: item.size,
    capacity: item.capacity,
    age_range: item.ageRange,
    price_manana: item.prices.manana,
    price_tarde: item.prices.tarde,
    price_completo: item.prices.completo,
    emoji: item.emoji,
    gradient: item.gradient,
    features: item.features,
    stock: item.stock,
    active: item.active,
    sort_order: item.sortOrder,
  }
}

export function rowToBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    code: row.code,
    inflatableId: row.inflatable_id,
    date: row.date,
    slot: row.slot,
    customer: {
      name: row.customer_name,
      phone: row.customer_phone,
      email: row.customer_email,
      address: row.customer_address,
      notes: row.customer_notes,
    },
    status: row.status,
    total: row.total,
    createdAt: row.created_at,
  }
}

/**
 * Traduce el error crudo de Postgres a algo que el cliente entienda.
 *
 * El código P0001 es el que Postgres asigna a un `raise exception` sin código
 * propio, y en este esquema eso solo ocurre dentro de nuestras funciones. O
 * sea: si viene P0001, el mensaje lo escribimos nosotros pensando en el
 * cliente y se puede mostrar tal cual. Cualquier otro código es una falla que
 * no queremos exponer (nombres de tablas, restricciones, etc.).
 */
function friendly(error: { message: string; code?: string }): string {
  if (/Failed to fetch|NetworkError/i.test(error.message)) {
    return 'No pudimos conectar con el servidor. Revisa tu conexión.'
  }
  if (error.code === 'P0001') {
    if (/Sin cupo/i.test(error.message)) {
      return 'Alguien acaba de tomar ese bloque. Elige otro horario u otra fecha.'
    }
    return error.message
  }
  return 'No pudimos registrar la reserva. Inténtalo otra vez.'
}

// --- Catálogo ---------------------------------------------------------------

export async function fetchInflatables(
  includeInactive = false,
): Promise<Inflatable[]> {
  let query = supabase.from('inflatables').select('*').order('sort_order')
  if (!includeInactive) query = query.eq('active', true)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data as InflatableRow[]).map(rowToInflatable)
}

export async function saveInflatable(item: Inflatable): Promise<void> {
  const { error } = await supabase
    .from('inflatables')
    .upsert(inflatableToRow(item))
  if (error) throw new Error(error.message)
}

// --- Disponibilidad y días bloqueados ---------------------------------------

/** Clave del mapa de cupos usados: fecha|juego|bloque. */
export function availabilityKey(
  date: string,
  inflatableId: string,
  slot: SlotId,
): string {
  return `${date}|${inflatableId}|${slot}`
}

export type AvailabilityMap = Map<string, number>

export async function fetchAvailability(
  from: string,
  to: string,
): Promise<AvailabilityMap> {
  const { data, error } = await supabase.rpc('get_availability', {
    p_from: from,
    p_to: to,
  })
  if (error) throw new Error(error.message)

  const map: AvailabilityMap = new Map()
  for (const row of (data ?? []) as AvailabilityRow[]) {
    map.set(availabilityKey(row.date, row.inflatable_id, row.slot), row.used)
  }
  return map
}

export async function fetchBlockedDays(from: string): Promise<BlockedDay[]> {
  const { data, error } = await supabase
    .from('blocked_days')
    .select('*')
    .gte('date', from)
    .order('date')
  if (error) throw new Error(error.message)
  return (data ?? []) as BlockedDay[]
}

export async function blockDay(date: string, reason: string): Promise<void> {
  const { error } = await supabase.from('blocked_days').upsert({ date, reason })
  if (error) throw new Error(error.message)
}

export async function unblockDay(date: string): Promise<void> {
  const { error } = await supabase.from('blocked_days').delete().eq('date', date)
  if (error) throw new Error(error.message)
}

// --- Reservas ---------------------------------------------------------------

export interface CreateBookingInput {
  inflatableId: string
  date: string
  slot: SlotId
  customer: Customer
  /**
   * Campo trampa del formulario. Una persona lo deja vacío siempre porque no
   * lo ve; un bot que rellena todos los inputs lo llena y la base rechaza la
   * reserva. Ver supabase/migrations/0004_limite_reservas.sql.
   */
  honeypot?: string
}

/**
 * Crea la reserva a través de la función create_booking, que valida cupo y
 * aplica los límites antispam dentro de la base de datos. El navegador nunca
 * inserta directo en la tabla.
 */
export async function createBooking(
  input: CreateBookingInput,
): Promise<Booking> {
  const { data, error } = await supabase.rpc('create_booking', {
    p_inflatable_id: input.inflatableId,
    p_date: input.date,
    p_slot: input.slot,
    p_name: input.customer.name,
    p_phone: input.customer.phone,
    p_address: input.customer.address,
    p_email: input.customer.email,
    p_notes: input.customer.notes,
    p_website: input.honeypot ?? '',
  })
  if (error) throw new Error(friendly(error))
  return rowToBooking(data as BookingRow)
}

/** Solo funciona con sesión de administrador (lo impone RLS). */
export async function fetchBookings(): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .order('date', { ascending: true })
  if (error) throw new Error(error.message)
  return (data as BookingRow[]).map(rowToBooking)
}

export async function updateBookingStatus(
  id: string,
  status: BookingStatus,
): Promise<void> {
  const { error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteBooking(id: string): Promise<void> {
  const { error } = await supabase.from('bookings').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
