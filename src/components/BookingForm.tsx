import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { Booking, Customer, Inflatable, SlotId } from '../types'
import { BUSINESS, SLOT_BY_ID } from '../data/catalog'
import { formatLong, money } from '../utils/date'

interface Props {
  inflatable: Inflatable
  date: string
  slot: SlotId
  onClose: () => void
  onConfirm: (customer: Customer, honeypot: string) => Promise<Booking>
}

const EMPTY: Customer = {
  name: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
}

type Errors = Partial<Record<keyof Customer, string>>

function validate(customer: Customer): Errors {
  const errors: Errors = {}
  if (customer.name.trim().length < 3) {
    errors.name = 'Escribe tu nombre completo.'
  }
  // Aceptamos espacios, guiones y +, pero exigimos al menos 8 dígitos.
  if (customer.phone.replace(/\D/g, '').length < 8) {
    errors.phone = 'Necesitamos un teléfono de contacto válido.'
  }
  if (customer.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
    errors.email = 'Ese correo no parece válido.'
  }
  if (customer.address.trim().length < 6) {
    errors.address = 'Indica la dirección donde instalamos el juego.'
  }
  return errors
}

export function BookingForm({
  inflatable,
  date,
  slot,
  onClose,
  onConfirm,
}: Props) {
  const [customer, setCustomer] = useState<Customer>(EMPTY)
  /**
   * Campo trampa: está en el DOM pero fuera de la pantalla, así que una
   * persona nunca lo llena. Los bots que recorren el formulario rellenando
   * todos los inputs sí, y la base rechaza esa reserva.
   *
   * Es un complemento, no la defensa principal: un bot que llama la API
   * directo ni siquiera carga este formulario. El freno de verdad son los
   * límites de supabase/migrations/0004_limite_reservas.sql.
   */
  const [honeypot, setHoneypot] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState<Booking | null>(null)

  const slotInfo = SLOT_BY_ID[slot]
  const total = inflatable.prices[slot]

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  function update<K extends keyof Customer>(field: K, value: Customer[K]) {
    setCustomer((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
    setServerError(null)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    // El botón se deshabilita al enviar, pero un Enter repetido puede colarse
    // antes del re-render y disparar dos reservas iguales.
    if (submitting) return
    const found = validate(customer)
    if (Object.keys(found).length > 0) {
      setErrors(found)
      return
    }
    setSubmitting(true)
    setServerError(null)
    try {
      setConfirmed(await onConfirm(customer, honeypot))
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : 'No pudimos registrar la reserva.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  /**
   * El perfil de Instagram publica un enlace corto wa.me/message/… que no
   * admite texto prellenado. Si algún día se completa BUSINESS.phone, el
   * mensaje se arma solo; mientras tanto abrimos el chat y el cliente copia
   * su código.
   */
  const resumen =
    `¡Hola ${BUSINESS.name}! Hice una reserva en la web:\n` +
    `• Juego: ${inflatable.name}\n` +
    `• Fecha: ${formatLong(date)}\n` +
    `• Bloque: ${slotInfo.label} (${slotInfo.hours})\n` +
    `• Dirección: ${customer.address}\n` +
    `• A nombre de: ${customer.name}` +
    (confirmed ? `\n• Código: ${confirmed.code}` : '')

  const digits = BUSINESS.phone.replace(/\D/g, '')
  const whatsappHref = digits
    ? `https://wa.me/${digits}?text=${encodeURIComponent(resumen)}`
    : BUSINESS.whatsappUrl

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-tinta/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={submitting ? undefined : onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Reservar juego"
        onClick={(event) => event.stopPropagation()}
        className="animate-pop-in max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-crema shadow-2xl sm:rounded-3xl"
      >
        {/* Resumen de lo que se está reservando */}
        <div
          className={`relative bg-gradient-to-br p-5 ${inflatable.gradient}`}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Cerrar"
            className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-crema/70 text-lg font-bold text-tinta transition hover:bg-crema disabled:opacity-40"
          >
            ✕
          </button>
          <div className="flex items-center gap-3">
            <span className="text-5xl">{inflatable.emoji}</span>
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-tinta">
                {inflatable.name}
              </h2>
              <p className="text-sm text-tinta first-letter:uppercase">
                {formatLong(date)}
              </p>
              <p className="text-sm text-tinta-media">
                {slotInfo.label} · {slotInfo.hours}
              </p>
            </div>
          </div>
          <p className="mt-4 inline-block rounded-full bg-crema/80 px-4 py-1.5 font-[family-name:var(--font-display)] text-lg font-semibold text-tinta">
            {total > 0 ? `Total ${money(total)}` : 'Precio a confirmar'}
          </p>
        </div>

        {confirmed ? (
          <div className="p-6 text-center">
            <h3 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-tinta">
              ¡Reserva registrada!
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-tinta-media">
              Guardamos tu solicitud. Queda <strong>pendiente</strong> hasta que{' '}
              {BUSINESS.owners} confirmen el horario contigo.
            </p>

            <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-tinta-suave">
              Tu código de reserva
            </p>
            <p className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-wider text-terracota">
              {confirmed.code}
            </p>

            <div className="mt-6 flex flex-col gap-2">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-salvia px-6 py-3 font-bold text-crema shadow-sm transition hover:brightness-95"
              >
                Avisar por WhatsApp
              </a>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border-2 border-arena-oscura px-6 py-3 font-bold text-tinta transition hover:border-terracota"
              >
                Listo
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 p-5" noValidate>
            {/*
              Campo trampa. Lo sacamos de la pantalla en vez de usar
              display:none porque varios bots saltan los campos ocultos con
              CSS, pero rellenan los que están posicionados fuera del borde.
              aria-hidden y tabIndex lo dejan fuera del lector de pantalla y
              del recorrido con Tab, así que nadie real lo encuentra.
            */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden"
            >
              <label htmlFor="field-website">Deja este campo vacío</label>
              <input
                id="field-website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(event) => setHoneypot(event.target.value)}
              />
            </div>

            <Field
              label="Nombre y apellido"
              error={errors.name}
              value={customer.name}
              onChange={(v) => update('name', v)}
              placeholder="Camila Rojas"
              autoComplete="name"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Teléfono"
                error={errors.phone}
                value={customer.phone}
                onChange={(v) => update('phone', v)}
                placeholder="+56 9 8765 4321"
                type="tel"
                autoComplete="tel"
              />
              <Field
                label="Correo (opcional)"
                error={errors.email}
                value={customer.email}
                onChange={(v) => update('email', v)}
                placeholder="camila@correo.cl"
                type="email"
                autoComplete="email"
              />
            </div>
            <Field
              label="Dirección del evento"
              error={errors.address}
              value={customer.address}
              onChange={(v) => update('address', v)}
              placeholder="Av. Siempre Viva 742, Las Condes"
              autoComplete="street-address"
            />

            <div>
              <label
                htmlFor="notes"
                className="mb-1.5 block text-sm font-bold text-tinta"
              >
                Comentarios (opcional)
              </label>
              <textarea
                id="notes"
                rows={3}
                value={customer.notes}
                onChange={(event) => update('notes', event.target.value)}
                placeholder="Es en el patio, hay toma de corriente a 10 m. Cumpleaños de 2 años."
                className="w-full resize-none rounded-xl border border-arena-oscura bg-crema px-3.5 py-2.5 text-sm outline-none transition focus:border-terracota focus:ring-2 focus:ring-terracota-pastel"
              />
            </div>

            <p className="rounded-xl bg-arena p-3 text-xs leading-relaxed text-tinta-media">
              Necesitamos un espacio plano de al menos{' '}
              <strong className="text-tinta">{inflatable.size}</strong> y un
              enchufe a menos de 20 m. El pago se coordina al confirmar la
              reserva.
            </p>

            {serverError && (
              <p
                role="alert"
                className="rounded-xl bg-terracota-pastel p-3 text-sm font-semibold text-terracota-oscuro"
              >
                {serverError}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-terracota px-6 py-3.5 font-bold text-crema shadow-lg shadow-terracota-claro/40 transition hover:bg-terracota-oscuro disabled:cursor-wait disabled:opacity-70"
            >
              {submitting ? 'Registrando reserva…' : 'Confirmar reserva'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

interface FieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  placeholder?: string
  type?: string
  autoComplete?: string
}

function Field({
  label,
  value,
  onChange,
  error,
  placeholder,
  type = 'text',
  autoComplete,
}: FieldProps) {
  const id = `field-${label.replace(/\s+/g, '-').toLowerCase()}`
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-bold text-tinta">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        className={`w-full rounded-xl border bg-crema px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-terracota-pastel ${
          error ? 'border-terracota' : 'border-arena-oscura focus:border-terracota'
        }`}
      />
      {error && (
        <p className="mt-1 text-xs font-semibold text-terracota-oscuro">{error}</p>
      )}
    </div>
  )
}
