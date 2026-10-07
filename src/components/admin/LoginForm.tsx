import { useState } from 'react'
import type { FormEvent } from 'react'
import { LogoLockup } from '../Logo'

interface Props {
  onSignIn: (email: string, password: string) => Promise<void>
}

export function LoginForm({ onSignIn }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await onSignIn(email.trim(), password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos iniciar sesión.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-tinta p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-3xl bg-crema p-8 shadow-2xl"
      >
        <LogoLockup />

        <h1 className="mt-6 font-[family-name:var(--font-display)] text-2xl font-semibold text-tinta">
          Panel de administración
        </h1>
        <p className="mt-1 text-sm text-tinta-media">
          Ingresa con la cuenta que creaste en Supabase.
        </p>

        <label
          htmlFor="admin-email"
          className="mb-1.5 mt-6 block text-sm font-bold text-tinta"
        >
          Correo
        </label>
        <input
          id="admin-email"
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-xl border border-arena-oscura bg-crema px-3.5 py-2.5 text-sm outline-none transition focus:border-terracota focus:ring-2 focus:ring-terracota-pastel"
        />

        <label
          htmlFor="admin-password"
          className="mb-1.5 mt-4 block text-sm font-bold text-tinta"
        >
          Contraseña
        </label>
        <input
          id="admin-password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-xl border border-arena-oscura bg-crema px-3.5 py-2.5 text-sm outline-none transition focus:border-terracota focus:ring-2 focus:ring-terracota-pastel"
        />

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl bg-terracota-pastel p-3 text-sm font-semibold text-terracota-oscuro"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full rounded-full bg-terracota px-6 py-3 font-bold text-crema transition hover:bg-terracota-oscuro disabled:opacity-60"
        >
          {submitting ? 'Entrando…' : 'Entrar'}
        </button>

        <a
          href="/"
          className="mt-4 block text-center text-sm font-semibold text-tinta-media hover:text-terracota"
        >
          Volver al sitio
        </a>
      </form>
    </div>
  )
}
