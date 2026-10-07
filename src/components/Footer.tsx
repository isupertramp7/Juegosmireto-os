import { Link } from 'react-router-dom'
import { BUSINESS } from '../data/catalog'
import { LogoLockup } from './Logo'

export function Footer() {
  return (
    <footer id="contacto" className="scroll-mt-20 bg-tinta py-14 text-arena">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-3">
        <div>
          <LogoLockup tone="light" />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-arena/80">
            Plazas blandas, soft play, castillos inflables blancos y piscinas de
            pelotas para arriendo. Cada pieza se sanitiza antes de llegar a tu
            celebración.
          </p>
          <p className="mt-4 text-sm text-arena/70">{BUSINESS.owners}</p>
        </div>

        <div>
          <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-crema">
            Contacto
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm text-arena/85">
            <li>
              <a
                href={BUSINESS.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="transition hover:text-crema"
              >
                WhatsApp · escríbenos directo
              </a>
            </li>
            <li>
              <a
                href={BUSINESS.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="transition hover:text-crema"
              >
                Instagram {BUSINESS.instagram}
              </a>
            </li>
            {BUSINESS.email && (
              <li>
                <a
                  href={`mailto:${BUSINESS.email}`}
                  className="transition hover:text-crema"
                >
                  {BUSINESS.email}
                </a>
              </li>
            )}
            <li>Arriendo en {BUSINESS.coverage}</li>
            <li>{BUSINESS.schedule}</li>
          </ul>
        </div>

        <div>
          <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-crema">
            Reserva con anticipación
          </h3>
          <p className="mt-4 text-sm leading-relaxed text-arena/85">
            Los fines de semana se llenan rápido, sobre todo en primavera y
            verano. Agenda con al menos dos semanas de anticipación.
          </p>
          <a
            href="#agenda"
            className="mt-6 inline-block rounded-full bg-terracota px-6 py-3 font-bold text-crema transition hover:bg-terracota-oscuro"
          >
            Ver disponibilidad
          </a>
        </div>
      </div>

      <div className="mx-auto mt-12 flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 border-t border-arena/20 px-4 pt-6 text-xs text-arena/60">
        <span>
          © {new Date().getFullYear()} {BUSINESS.name}. Todos los derechos
          reservados.
        </span>
        <Link to="/admin" className="ml-auto transition hover:text-arena">
          Panel de administración
        </Link>
      </div>
    </footer>
  )
}
