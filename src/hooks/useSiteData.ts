import { useCallback, useEffect, useState } from 'react'
import type { BlockedDay, Inflatable } from '../types'
import {
  fetchAvailability,
  fetchBlockedDays,
  fetchInflatables,
  type AvailabilityMap,
} from '../lib/api'
import { isSupabaseConfigured } from '../lib/supabase'
import { addDays, todayKey } from '../utils/date'

/** Ventana de disponibilidad que traemos de una sola vez. */
const HORIZON_DAYS = 400

/**
 * Carga lo que el sitio público necesita: catálogo activo, cupos ya usados y
 * días bloqueados. Todo sale de la base, así que la disponibilidad que ve el
 * cliente es la real.
 */
export function useSiteData() {
  const [catalog, setCatalog] = useState<Inflatable[]>([])
  const [availability, setAvailability] = useState<AvailabilityMap>(new Map())
  const [blockedDays, setBlockedDays] = useState<BlockedDay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setError('falta-configuracion')
      setLoading(false)
      return
    }
    try {
      setError(null)
      const from = todayKey()
      const to = addDays(from, HORIZON_DAYS)
      const [items, used, blocked] = await Promise.all([
        fetchInflatables(),
        fetchAvailability(from, to),
        fetchBlockedDays(from),
      ])
      setCatalog(items)
      setAvailability(used)
      setBlockedDays(blocked)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  /** Refresca solo los cupos, después de que alguien reserva. */
  const refreshAvailability = useCallback(async () => {
    if (!isSupabaseConfigured) return
    const from = todayKey()
    try {
      setAvailability(await fetchAvailability(from, addDays(from, HORIZON_DAYS)))
    } catch {
      /* si falla, el calendario se queda con los datos previos */
    }
  }, [])

  const blockedSet = new Set(blockedDays.map((d) => d.date))

  return {
    catalog,
    availability,
    blockedDays,
    blockedSet,
    loading,
    error,
    reload: load,
    refreshAvailability,
  }
}
