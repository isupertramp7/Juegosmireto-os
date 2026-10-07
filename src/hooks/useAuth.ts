import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

/**
 * Sesión de Supabase + verificación de que el usuario esté en la tabla
 * `admins`. Tener cuenta no basta: la política RLS solo deja ver reservas a
 * quien esté en esa tabla.
 */
export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function checkAdmin(current: Session | null) {
      if (!current) {
        if (active) {
          setIsAdmin(false)
          setLoading(false)
        }
        return
      }
      const { data } = await supabase
        .from('admins')
        .select('user_id')
        .eq('user_id', current.user.id)
        .maybeSingle()

      if (active) {
        setIsAdmin(Boolean(data))
        setLoading(false)
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      void checkAdmin(data.session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, next) => {
        setSession(next)
        setLoading(true)
        void checkAdmin(next)
      },
    )

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      throw new Error(
        /Invalid login/i.test(error.message)
          ? 'Correo o contraseña incorrectos.'
          : error.message,
      )
    }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  return { session, isAdmin, loading, signIn, signOut }
}
