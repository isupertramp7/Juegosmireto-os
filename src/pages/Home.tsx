import { useState } from 'react'
import type { Customer, SlotId } from '../types'
import { createBooking } from '../lib/api'
import { useSiteData } from '../hooks/useSiteData'
import { todayKey } from '../utils/date'
import { Header } from '../components/Header'
import { Hero } from '../components/Hero'
import { Catalog } from '../components/Catalog'
import { Calendar } from '../components/Calendar'
import { DayPanel } from '../components/DayPanel'
import { BookingForm } from '../components/BookingForm'
import { HowItWorks } from '../components/HowItWorks'
import { Footer } from '../components/Footer'
import { SetupNotice } from '../components/SetupNotice'

interface Selection {
  inflatableId: string
  slot: SlotId
}

export default function Home() {
  const {
    catalog,
    availability,
    blockedSet,
    loading,
    error,
    refreshAvailability,
  } = useSiteData()

  const [selectedDate, setSelectedDate] = useState(todayKey())
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const [selection, setSelection] = useState<Selection | null>(null)

  function handleReserveFromCatalog(inflatableId: string) {
    setHighlightId(inflatableId)
    document.getElementById('agenda')?.scrollIntoView({ behavior: 'smooth' })
  }

  async function handleConfirm(customer: Customer, honeypot: string) {
    if (!selection) throw new Error('No hay selección activa')
    const booking = await createBooking({
      inflatableId: selection.inflatableId,
      date: selectedDate,
      slot: selection.slot,
      customer,
      honeypot,
    })
    // El calendario tiene que reflejar el cupo recién tomado.
    await refreshAvailability()
    return booking
  }

  const selectedItem = selection
    ? (catalog.find((item) => item.id === selection.inflatableId) ?? null)
    : null

  if (error === 'falta-configuracion') return <SetupNotice />

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero catalogSize={catalog.length} />
        <Catalog
          items={catalog}
          loading={loading}
          onReserve={handleReserveFromCatalog}
        />

        <section
          id="agenda"
          className="scroll-mt-20 bg-gradient-to-b from-salvia-pastel/60 via-crema to-crema py-16 md:py-24"
        >
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-12 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-terracota">
                Disponibilidad en vivo
              </p>
              <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold text-tinta sm:text-4xl">
                Agenda tu fecha
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-tinta-media">
                Toca un día en el calendario y mira qué juegos quedan libres en
                cada bloque horario.
              </p>
            </div>

            {error && error !== 'falta-configuracion' && (
              <p
                role="alert"
                className="mx-auto mb-6 max-w-xl rounded-2xl bg-terracota-pastel p-4 text-center text-sm font-semibold text-terracota-oscuro"
              >
                No pudimos cargar la disponibilidad: {error}
              </p>
            )}

            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
              <Calendar
                catalog={catalog}
                availability={availability}
                blockedSet={blockedSet}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
              />
              <DayPanel
                catalog={catalog}
                availability={availability}
                date={selectedDate}
                blocked={blockedSet.has(selectedDate)}
                highlightId={highlightId}
                onPick={(inflatableId, slot) =>
                  setSelection({ inflatableId, slot })
                }
              />
            </div>
          </div>
        </section>

        <HowItWorks />
      </main>
      <Footer />

      {selection && selectedItem && (
        <BookingForm
          inflatable={selectedItem}
          date={selectedDate}
          slot={selection.slot}
          onClose={() => setSelection(null)}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  )
}
