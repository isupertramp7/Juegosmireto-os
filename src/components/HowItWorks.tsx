import { BUSINESS } from '../data/catalog'

const STEPS = [
  {
    title: 'Elige la fecha',
    text: 'Mira el calendario y toca el día de tu evento. Los colores muestran la disponibilidad real.',
  },
  {
    title: 'Elige juego y bloque',
    text: 'Mañana, tarde o día completo. El precio se calcula solo según lo que selecciones.',
  },
  {
    title: 'Deja tus datos',
    text: 'Nombre, teléfono y dirección del evento. Queda guardada como reserva pendiente.',
  },
  {
    title: 'Nosotros llegamos',
    text: 'Instalamos una hora antes, dejamos todo probado y sanitizado, y retiramos al final del bloque.',
  },
]

const FAQ = [
  {
    q: '¿Qué incluye el arriendo?',
    a: 'Traslado, armado, desarme y sanitización completa de cada pieza antes de llegar a tu casa. Las plazas blandas incluyen su cerco y el piso acolchado.',
  },
  {
    q: '¿Atienden fuera del sector oriente?',
    a: 'Nuestra cobertura habitual es Santiago Oriente. Para otras comunas escríbenos por WhatsApp y te confirmamos si llegamos y el costo de traslado.',
  },
  {
    q: '¿Qué necesito tener listo?',
    a: 'Un espacio plano y despejado del tamaño del juego, acceso por una puerta de al menos 90 cm y, para los inflables, un enchufe a menos de 20 metros.',
  },
  {
    q: '¿Se puede instalar dentro de la casa?',
    a: 'Sí. Las plazas blandas, el soft play y la plaza Pikler están pensados para interior. Para los inflables necesitamos revisar la altura del techo.',
  },
  {
    q: '¿Qué pasa si llueve?',
    a: 'Si el juego iba afuera y no hay dónde moverlo, reprogramamos sin costo para otra fecha disponible.',
  },
  {
    q: '¿Cómo se paga?',
    a: 'Se coordina al confirmar la reserva por WhatsApp: un abono para tomar la fecha y el saldo el día del evento.',
  },
]

export function HowItWorks() {
  return (
    <section
      id="como-funciona"
      className="scroll-mt-20 bg-arena/60 py-16 md:py-24"
    >
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-12 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-terracota">
            Sin complicaciones
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold text-tinta sm:text-4xl">
            Cómo funciona
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-tinta-media">
            Cuatro pasos y listo. Sin llamadas eternas ni esperar respuesta.
          </p>
        </div>

        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="rounded-3xl border border-arena-oscura/50 bg-crema p-6 shadow-sm"
            >
              <span className="grid size-10 place-items-center rounded-full bg-terracota-pastel font-[family-name:var(--font-display)] text-lg font-semibold text-terracota">
                {index + 1}
              </span>
              <h3 className="mt-4 font-[family-name:var(--font-display)] text-lg font-semibold text-tinta">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-tinta-media">
                {step.text}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-16">
          <h3 className="mb-6 text-center font-[family-name:var(--font-display)] text-2xl font-semibold text-tinta">
            Preguntas frecuentes
          </h3>
          <div className="mx-auto grid max-w-4xl gap-3 sm:grid-cols-2">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl border border-arena-oscura/50 bg-crema p-4 shadow-sm"
              >
                <summary className="cursor-pointer list-none font-bold text-tinta marker:hidden">
                  <span className="mr-2 inline-block text-terracota transition group-open:rotate-90">
                    ▸
                  </span>
                  {item.q}
                </summary>
                <p className="mt-2 pl-6 text-sm leading-relaxed text-tinta-media">
                  {item.a}
                </p>
              </details>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-tinta-media">
            ¿Otra duda?{' '}
            <a
              href={BUSINESS.whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="font-bold text-terracota hover:underline"
            >
              Escríbenos por WhatsApp
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}
