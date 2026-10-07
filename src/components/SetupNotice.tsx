import { Logo } from './Logo'

/** Pantalla que aparece cuando todavía no existe .env.local con las claves. */
export function SetupNotice() {
  return (
    <div className="grid min-h-screen place-items-center bg-arena p-6">
      <div className="max-w-xl rounded-3xl border border-arena-oscura bg-crema p-8 shadow-sm">
        <Logo size={56} />
        <h1 className="mt-5 font-[family-name:var(--font-display)] text-2xl font-semibold text-tinta">
          Falta conectar Supabase
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-tinta-media">
          Crea un archivo <code className="rounded bg-arena px-1">.env.local</code>{' '}
          en la raíz del proyecto (puedes copiar{' '}
          <code className="rounded bg-arena px-1">.env.example</code>) con los
          datos de tu proyecto:
        </p>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-tinta p-4 text-xs text-arena">
          {`VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key`}
        </pre>
        <p className="mt-4 text-sm leading-relaxed text-tinta-media">
          Los encuentras en Supabase → <strong>Project Settings</strong> →{' '}
          <strong>Data API</strong> y <strong>API Keys</strong>. Después reinicia{' '}
          <code className="rounded bg-arena px-1">npm run dev</code>, porque Vite
          lee las variables de entorno solo al arrancar.
        </p>
      </div>
    </div>
  )
}
