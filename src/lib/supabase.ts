import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Mientras no exista .env.local la app igual carga: mostramos un aviso en
 * pantalla en vez de romper con una página en blanco.
 */
export const isSupabaseConfigured =
  Boolean(url) && Boolean(anonKey) && !url.includes('TU-PROYECTO')

export const supabase = createClient(
  url || 'http://localhost:54321',
  anonKey || 'sin-configurar',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  },
)
