import { BUSINESS } from '../data/catalog'
import { Logo } from './Logo'

interface Props {
  catalogSize: number
}

export function Hero({ catalogSize }: Props) {
  const stats = [
    { value: `${catalogSize || '—'}`, label: 'juegos para arrendar' },
    { value: 'Santiago', label: 'sector oriente' },
    { value: '0–8', label: 'años de edad' },
  ]

  return (
    <section
      id="inicio"
      className="relative overflow-hidden bg-gradient-to-b from-arena via-crema to-crema"
    >
      {/* Manchas pastel de fondo, muy tenues */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-8 size-64 rounded-full bg-rosa-pastel blur-3xl" />
        <div className="absolute right-0 top-40 size-72 rounded-full bg-salvia-pastel blur-3xl" />
        <div className="absolute bottom-0 left-1/3 size-64 rounded-full bg-terracota-pastel blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:grid-cols-2 md:py-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-terracota-claro bg-crema/80 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-terracota">
            Arriendo en {BUSINESS.coverage}
          </span>

          <h1 className="mt-6 font-[family-name:var(--font-display)] text-4xl font-semibold leading-[1.1] text-tinta sm:text-5xl lg:text-6xl">
            Plazas blandas que se ven{' '}
            <span className="italic text-terracota">preciosas</span> en tu
            celebración
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-tinta-media">
            Soft play, castillos inflables blancos, piscinas de pelotas y plazas
            Pikler en tonos pastel. Llevamos, instalamos y retiramos: tú solo
            disfrutas la fiesta.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href="#agenda"
              className="rounded-full bg-terracota px-7 py-3.5 font-bold text-crema shadow-lg shadow-terracota-claro/40 transition hover:bg-terracota-oscuro"
            >
              Ver calendario y reservar
            </a>
            <a
              href="#juegos"
              className="rounded-full border-2 border-arena-oscura bg-crema px-7 py-3.5 font-bold text-tinta transition hover:border-terracota hover:text-terracota"
            >
              Mirar los juegos
            </a>
          </div>

          <dl className="mt-12 flex flex-wrap gap-x-10 gap-y-4">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="font-[family-name:var(--font-display)] text-3xl font-semibold text-tinta">
                  {stat.value}
                </dt>
                <dd className="text-sm text-tinta-suave">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative hidden justify-center md:flex">
          <div className="animate-float-slow grid size-80 place-items-center rounded-full bg-crema shadow-[0_24px_60px_-20px_rgba(74,64,58,0.25)]">
            <Logo size={250} />
          </div>
          <span className="absolute right-4 top-6 rounded-2xl bg-crema px-4 py-2 text-sm font-bold text-tinta shadow-md">
            {BUSINESS.owners}
          </span>
          <span className="absolute bottom-10 left-0 rounded-2xl bg-salvia-pastel px-4 py-2 text-sm font-bold text-tinta shadow-md">
            Instalación incluida
          </span>
        </div>
      </div>
    </section>
  )
}
