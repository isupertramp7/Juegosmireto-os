interface Props {
  /** Alto en píxeles del isotipo. */
  size?: number
  className?: string
}

/**
 * Isotipo de Mis Retoños: arcoíris pastel con orejas de conejo.
 *
 * Es una reconstrucción en SVG inspirada en el logo de Instagram, pensada para
 * que el sitio se vea terminado mientras no esté el archivo original. Para usar
 * el logo de verdad: deja el PNG o SVG en `public/logo.svg` y reemplaza este
 * componente por `<img src="/logo.svg" alt="Mis Retoños" />`.
 */
export function Logo({ size = 40, className = '' }: Props) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label="Mis Retoños"
      className={className}
    >
      <circle cx="50" cy="50" r="50" fill="#fdfaf6" />

      {/* Orejas de conejo */}
      <g stroke="#c4836a" strokeWidth="3.4" fill="#faeeeb" strokeLinejoin="round">
        <ellipse cx="41" cy="26" rx="7" ry="13" transform="rotate(-11 41 26)" />
        <ellipse cx="59" cy="26" rx="7" ry="13" transform="rotate(11 59 26)" />
      </g>

      {/* Arcos del arcoíris, de afuera hacia adentro */}
      <g fill="none" strokeWidth="6.4" strokeLinecap="round">
        <path d="M14 66a36 36 0 0 1 72 0" stroke="#e3b9a6" />
        <path d="M23 66a27 27 0 0 1 54 0" stroke="#d8b274" />
        <path d="M32 66a18 18 0 0 1 36 0" stroke="#a4b49c" />
        <path d="M41 66a9 9 0 0 1 18 0" stroke="#e4b7b2" />
      </g>

      {/* Corazón bajo el arcoíris */}
      <path
        d="M50 74.5c-3.6-3-6-4.7-6-7.3a3 3 0 0 1 6-1.1 3 3 0 0 1 6 1.1c0 2.6-2.4 4.3-6 7.3Z"
        fill="#c4836a"
      />
    </svg>
  )
}

/** Logo con el nombre al lado, para la barra superior y el pie de página. */
export function LogoLockup({
  size = 42,
  tone = 'dark',
}: {
  size?: number
  tone?: 'dark' | 'light'
}) {
  return (
    <span className="flex items-center gap-2.5">
      <Logo size={size} className="shrink-0 rounded-full" />
      <span className="leading-none">
        <span
          className={`block font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight ${
            tone === 'light' ? 'text-crema' : 'text-tinta'
          }`}
        >
          Mis Retoños
        </span>
        <span
          className={`mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.18em] ${
            tone === 'light' ? 'text-arena-oscura' : 'text-tinta-suave'
          }`}
        >
          Juegos · Inflables
        </span>
      </span>
    </span>
  )
}
