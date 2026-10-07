import type { SlotId, SlotInfo } from '../types'

/**
 * Los bloques horarios son fijos y viven en el código porque la función
 * create_booking() de la base de datos usa los mismos identificadores
 * ('manana', 'tarde', 'completo') en el tipo slot_id.
 */
export const SLOTS: SlotInfo[] = [
  { id: 'manana', label: 'Mañana', hours: '09:00 – 13:00' },
  { id: 'tarde', label: 'Tarde', hours: '14:00 – 19:00' },
  { id: 'completo', label: 'Día completo', hours: '09:00 – 19:00' },
]

export const SLOT_BY_ID: Record<SlotId, SlotInfo> = SLOTS.reduce(
  (acc, slot) => ({ ...acc, [slot.id]: slot }),
  {} as Record<SlotId, SlotInfo>,
)

/**
 * Datos del negocio, tomados del perfil @juegosmisretonos.
 * Falta el teléfono: complétalo cuando lo tengas.
 */
export const BUSINESS = {
  name: 'Mis Retoños',
  tagline: 'Juegos · Inflables · Decoración',
  owners: 'Xavi y Feli',
  /** Enlace corto de WhatsApp Business del perfil de Instagram. */
  whatsappUrl: 'https://wa.me/message/7URLOPX4OX4QH1',
  /** TODO: reemplazar por el teléfono real para mostrarlo en el pie. */
  phone: '',
  email: '',
  instagram: '@juegosmisretonos',
  instagramUrl: 'https://www.instagram.com/juegosmisretonos/',
  coverage: 'Santiago Oriente',
  schedule: 'Lunes a domingo · 09:00 a 21:00',
}

/** Paletas pastel disponibles al crear o editar un juego desde el panel. */
export const GRADIENTS = [
  'from-rosa-pastel via-rosa-claro to-rosa',
  'from-salvia-pastel via-salvia-claro to-salvia',
  'from-terracota-pastel via-terracota-claro to-terracota',
  'from-arena via-mostaza-claro to-mostaza',
  'from-cielo-claro via-cielo to-salvia-claro',
  'from-crema via-arena to-arena-oscura',
]
