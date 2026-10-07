import { useState } from 'react'
import type { Inflatable } from '../../types'
import { GRADIENTS, SLOTS } from '../../data/catalog'
import { saveInflatable } from '../../lib/api'
import { money } from '../../utils/date'

interface Props {
  catalog: Inflatable[]
  onSaved: () => Promise<void> | void
}

const BLANK: Inflatable = {
  id: '',
  name: '',
  tagline: '',
  description: '',
  size: '',
  capacity: 8,
  ageRange: '',
  prices: { manana: 0, tarde: 0, completo: 0 },
  emoji: '🌈',
  gradient: GRADIENTS[0],
  features: [],
  stock: 1,
  active: true,
  sortOrder: 99,
}

/** Convierte "Castillo Blanco" en "castillo-blanco" para usarlo como id. */
function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

export function AdminInflatables({ catalog, onSaved }: Props) {
  const [editing, setEditing] = useState<Inflatable | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function startEdit(item: Inflatable) {
    setEditing({
      ...item,
      prices: { ...item.prices },
      features: [...item.features],
    })
    setIsNew(false)
    setError(null)
  }

  function startNew() {
    setEditing({
      ...BLANK,
      prices: { ...BLANK.prices },
      sortOrder: catalog.length + 1,
    })
    setIsNew(true)
    setError(null)
  }

  async function save() {
    if (!editing) return
    const id = isNew ? slugify(editing.name) : editing.id
    if (!id) {
      setError('El juego necesita un nombre.')
      return
    }
    if (isNew && catalog.some((item) => item.id === id)) {
      setError('Ya existe un juego con ese nombre.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      await saveInflatable({ ...editing, id })
      await onSaved()
      setEditing(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  function patch(changes: Partial<Inflatable>) {
    setEditing((prev) => (prev ? { ...prev, ...changes } : prev))
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-tinta-media">
          Cambia precios, stock o esconde un juego. Los cambios se ven al
          instante en el sitio público.
        </p>
        <button
          type="button"
          onClick={startNew}
          className="rounded-full bg-tinta px-5 py-2.5 text-sm font-bold text-crema transition hover:bg-terracota"
        >
          + Nuevo juego
        </button>
      </div>

      <ul className="grid gap-3 lg:grid-cols-2">
        {catalog.map((item) => (
          <li
            key={item.id}
            className={`rounded-2xl border bg-crema p-4 shadow-sm ${
              item.active
                ? 'border-arena-oscura/60'
                : 'border-arena-oscura opacity-60'
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-2xl ${item.gradient}`}
              >
                {item.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-tinta">{item.name}</p>
                <p className="truncate text-xs text-tinta-media">
                  {item.size} · stock {item.stock}
                  {!item.active && ' · oculto'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => startEdit(item)}
                className="rounded-full border-2 border-arena-oscura px-4 py-1.5 text-xs font-bold text-tinta transition hover:border-terracota hover:text-terracota"
              >
                Editar
              </button>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              {SLOTS.map((slot) => (
                <div key={slot.id} className="rounded-lg bg-arena py-1.5">
                  <p className="text-tinta-suave">{slot.label}</p>
                  <p className="font-bold text-tinta">
                    {item.prices[slot.id] > 0
                      ? money(item.prices[slot.id])
                      : 'Sin precio'}
                  </p>
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-tinta/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => !saving && setEditing(null)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Editar juego"
            onClick={(event) => event.stopPropagation()}
            className="animate-pop-in max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-crema p-6 shadow-2xl sm:rounded-3xl"
          >
            <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold text-tinta">
              {isNew ? 'Nuevo juego' : editing.name}
            </h3>
            {!isNew && (
              <p className="mt-1 font-mono text-xs text-tinta-suave">
                id: {editing.id}
              </p>
            )}

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Text
                label="Nombre"
                value={editing.name}
                onChange={(v) => patch({ name: v })}
              />
              <Text
                label="Frase corta"
                value={editing.tagline}
                onChange={(v) => patch({ tagline: v })}
              />
              <Text
                label="Medidas"
                value={editing.size}
                onChange={(v) => patch({ size: v })}
                placeholder="4 x 4 m"
              />
              <Text
                label="Edad recomendada"
                value={editing.ageRange}
                onChange={(v) => patch({ ageRange: v })}
                placeholder="1 a 6 años"
              />
              <Num
                label="Capacidad (niños)"
                value={editing.capacity}
                onChange={(v) => patch({ capacity: v })}
              />
              <Num
                label="Stock (unidades que tienes)"
                value={editing.stock}
                onChange={(v) => patch({ stock: v })}
              />
            </div>

            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-bold text-tinta">
                Descripción
              </label>
              <textarea
                rows={3}
                value={editing.description}
                onChange={(event) => patch({ description: event.target.value })}
                className="w-full resize-none rounded-xl border border-arena-oscura bg-crema px-3.5 py-2.5 text-sm outline-none focus:border-terracota focus:ring-2 focus:ring-terracota-pastel"
              />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              {SLOTS.map((slot) => (
                <Num
                  key={slot.id}
                  label={`Precio ${slot.label.toLowerCase()}`}
                  value={editing.prices[slot.id]}
                  onChange={(v) =>
                    patch({ prices: { ...editing.prices, [slot.id]: v } })
                  }
                />
              ))}
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Text
                label="Emoji de portada"
                value={editing.emoji}
                onChange={(v) => patch({ emoji: v })}
              />
              <Text
                label="Características (separadas por coma)"
                value={editing.features.join(', ')}
                onChange={(v) =>
                  patch({
                    features: v
                      .split(',')
                      .map((f) => f.trim())
                      .filter(Boolean),
                  })
                }
              />
            </div>

            <div className="mt-4">
              <p className="mb-2 text-sm font-bold text-tinta">Color</p>
              <div className="flex flex-wrap gap-2">
                {GRADIENTS.map((gradient) => (
                  <button
                    key={gradient}
                    type="button"
                    aria-label={`Color ${gradient}`}
                    onClick={() => patch({ gradient })}
                    className={`size-10 rounded-xl bg-gradient-to-br ${gradient} ${
                      editing.gradient === gradient
                        ? 'ring-2 ring-tinta ring-offset-2'
                        : ''
                    }`}
                  />
                ))}
              </div>
            </div>

            <label className="mt-5 flex items-center gap-2 text-sm font-bold text-tinta">
              <input
                type="checkbox"
                checked={editing.active}
                onChange={(event) => patch({ active: event.target.checked })}
                className="size-4 accent-terracota"
              />
              Visible en el sitio público
            </label>

            {error && (
              <p
                role="alert"
                className="mt-4 rounded-xl bg-terracota-pastel p-3 text-sm font-semibold text-terracota-oscuro"
              >
                {error}
              </p>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => void save()}
                disabled={saving}
                className="flex-1 rounded-full bg-terracota px-6 py-3 font-bold text-crema transition hover:bg-terracota-oscuro disabled:opacity-60"
              >
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                disabled={saving}
                className="rounded-full border-2 border-arena-oscura px-6 py-3 font-bold text-tinta"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Text({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-bold text-tinta">
        {label}
      </label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-arena-oscura bg-crema px-3.5 py-2.5 text-sm outline-none focus:border-terracota focus:ring-2 focus:ring-terracota-pastel"
      />
    </div>
  )
}

function Num({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-bold text-tinta">
        {label}
      </label>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(event) => onChange(Number(event.target.value) || 0)}
        className="w-full rounded-xl border border-arena-oscura bg-crema px-3.5 py-2.5 text-sm outline-none focus:border-terracota focus:ring-2 focus:ring-terracota-pastel"
      />
    </div>
  )
}
