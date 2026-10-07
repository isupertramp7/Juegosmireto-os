import type { Inflatable, SlotId } from '../types'
import { SLOTS } from '../data/catalog'
import { availabilityKey, type AvailabilityMap } from '../lib/api'

/**
 * Unidades ya tomadas de un juego en esa fecha y bloque.
 *
 * Esta función replica exactamente la condición de create_booking() en la base
 * de datos: "día completo" choca con mañana y con tarde, y viceversa. El
 * navegador la usa para pintar la disponibilidad; la base es la que manda.
 */
export function usedUnits(
  map: AvailabilityMap,
  inflatableId: string,
  date: string,
  slot: SlotId,
): number {
  const at = (s: SlotId) => map.get(availabilityKey(date, inflatableId, s)) ?? 0

  if (slot === 'completo') {
    return at('manana') + at('tarde') + at('completo')
  }
  return at(slot) + at('completo')
}

export function remainingUnits(
  map: AvailabilityMap,
  item: Inflatable,
  date: string,
  slot: SlotId,
): number {
  return item.stock - usedUnits(map, item.id, date, slot)
}

export function isAvailable(
  map: AvailabilityMap,
  item: Inflatable,
  date: string,
  slot: SlotId,
): boolean {
  return remainingUnits(map, item, date, slot) > 0
}

/** Bloques horarios con cupo para ese juego en esa fecha. */
export function freeSlots(
  map: AvailabilityMap,
  item: Inflatable,
  date: string,
): SlotId[] {
  return SLOTS.filter((slot) => isAvailable(map, item, date, slot.id)).map(
    (slot) => slot.id,
  )
}

export interface DayAvailability {
  /** Juegos con al menos un bloque libre. */
  free: number
  total: number
}

export function dayAvailability(
  map: AvailabilityMap,
  items: Inflatable[],
  date: string,
): DayAvailability {
  const free = items.filter((item) => freeSlots(map, item, date).length > 0)
  return { free: free.length, total: items.length }
}
