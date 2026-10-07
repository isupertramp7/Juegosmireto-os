import type { Inflatable } from '../types'
import { money } from '../utils/date'

interface Props {
  items: Inflatable[]
  loading: boolean
  onReserve: (inflatableId: string) => void
}

export function Catalog({ items, loading, onReserve }: Props) {
  return (
    <section id="juegos" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 md:py-24">
      <div className="mb-12 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-terracota">
          Nuestro catálogo
        </p>
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold text-tinta sm:text-4xl">
          Juegos para arrendar
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-tinta-media">
          Todos incluyen traslado, armado, desarme y sanitización. El precio
          depende del bloque horario que elijas.
        </p>
      </div>

      {loading && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-96 animate-pulse rounded-3xl border border-arena-oscura/50 bg-arena"
            />
          ))}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <article
            key={item.id}
            className="group flex flex-col overflow-hidden rounded-3xl border border-arena-oscura/50 bg-crema shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div
              className={`relative grid h-44 place-items-center bg-gradient-to-br ${item.gradient}`}
            >
              <span className="text-7xl transition group-hover:scale-110">
                {item.emoji}
              </span>
              <span className="absolute left-4 top-4 rounded-full bg-crema/90 px-3 py-1 text-xs font-bold text-tinta">
                {item.tagline}
              </span>
            </div>

            <div className="flex flex-1 flex-col p-5">
              <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold text-tinta">
                {item.name}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-tinta-media">
                {item.description}
              </p>

              <ul className="mt-4 flex flex-wrap gap-1.5">
                {item.features.map((feature) => (
                  <li
                    key={feature}
                    className="rounded-full bg-arena px-2.5 py-1 text-xs font-semibold text-tinta-media"
                  >
                    {feature}
                  </li>
                ))}
              </ul>

              <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-arena-oscura/50 pt-4 text-center text-xs">
                <div>
                  <dt className="text-tinta-suave">Medidas</dt>
                  <dd className="font-bold text-tinta">{item.size}</dd>
                </div>
                <div>
                  <dt className="text-tinta-suave">Capacidad</dt>
                  <dd className="font-bold text-tinta">{item.capacity} niños</dd>
                </div>
                <div>
                  <dt className="text-tinta-suave">Edad</dt>
                  <dd className="font-bold text-tinta">{item.ageRange}</dd>
                </div>
              </dl>

              <div className="mt-5 flex items-center justify-between gap-3">
                <p className="text-sm text-tinta-suave">
                  {item.prices.manana > 0 ? (
                    <>
                      desde{' '}
                      <span className="font-[family-name:var(--font-display)] text-xl font-semibold text-terracota">
                        {money(item.prices.manana)}
                      </span>
                    </>
                  ) : (
                    <span className="font-semibold text-tinta-media">
                      Consultar precio
                    </span>
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => onReserve(item.id)}
                  className="rounded-full bg-tinta px-5 py-2.5 text-sm font-bold text-crema transition hover:bg-terracota"
                >
                  Reservar
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
