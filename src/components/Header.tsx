import { useState } from 'react'
import { BUSINESS } from '../data/catalog'
import { LogoLockup } from './Logo'

const LINKS = [
  { href: '#juegos', label: 'Juegos' },
  { href: '#agenda', label: 'Agendar' },
  { href: '#como-funciona', label: 'Cómo funciona' },
  { href: '#contacto', label: 'Contacto' },
]

export function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-arena-oscura/60 bg-crema/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <a href="#inicio" aria-label={BUSINESS.name}>
          <LogoLockup />
        </a>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-2 text-sm font-semibold text-tinta-media transition hover:bg-arena hover:text-terracota"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={BUSINESS.whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-full bg-terracota px-5 py-2.5 text-sm font-bold text-crema shadow-sm transition hover:bg-terracota-oscuro sm:block"
          >
            Escríbenos
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Abrir menú"
            aria-expanded={open}
            className="grid size-10 place-items-center rounded-xl border border-arena-oscura text-tinta-media md:hidden"
          >
            <span className="text-lg">{open ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-arena-oscura/60 bg-crema px-4 pb-4 pt-2 md:hidden">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-2.5 text-sm font-semibold text-tinta hover:bg-arena"
            >
              {link.label}
            </a>
          ))}
          <a
            href={BUSINESS.whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-1 rounded-xl bg-terracota px-3 py-2.5 text-center text-sm font-bold text-crema"
          >
            Escríbenos por WhatsApp
          </a>
        </nav>
      )}
    </header>
  )
}
