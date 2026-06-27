'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { updateEvent } from '@/lib/actions/events'
import type { EventType, SectionName } from '@/lib/supabase/types'
import { SECTION_LABELS } from '@/lib/utils'

const SECTIONS = Object.entries(SECTION_LABELS) as [SectionName, string][]

type RepeatMode = 'none' | 'weekly' | 'biweekly'

interface EventData {
  id: string
  title: string
  event_type_id: string
  starts_at: string
  checkin_window_min: number
  target_sections: SectionName[] | null
  notes: string | null
}

function defaultStartsAt() {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return now.toISOString().slice(0, 16)
}

export default function EventForm({
  eventTypes,
  initialSections = [],
  event,
}: {
  eventTypes: EventType[]
  initialSections?: SectionName[]
  event?: EventData
}) {
  const router = useRouter()
  const isEdit = !!event

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const [title, setTitle] = useState(event?.title ?? '')
  const [eventTypeId, setEventTypeId] = useState(event?.event_type_id ?? eventTypes[0]?.id ?? '')
  const [startsAt, setStartsAt] = useState(() => {
    if (event?.starts_at) {
      const d = new Date(event.starts_at)
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
      return d.toISOString().slice(0, 16)
    }
    return defaultStartsAt()
  })
  const [checkinWindowMin, setCheckinWindowMin] = useState(event?.checkin_window_min ?? 60)
  const [notes, setNotes] = useState(event?.notes ?? '')
  const [targetSections, setTargetSections] = useState<SectionName[]>(
    event?.target_sections ?? initialSections
  )
  const [repeat, setRepeat] = useState<RepeatMode>('none')

  function toggleSection(sec: SectionName) {
    setTargetSections(prev =>
      prev.includes(sec) ? prev.filter(s => s !== sec) : [...prev, sec]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (isEdit) {
      const result = await updateEvent(event.id, {
        title,
        eventTypeId,
        startsAt,
        checkinWindowMin,
        targetSections,
        notes,
      })
      if (result?.error) {
        setError(result.error)
        setLoading(false)
      }
      return
    }

    // Crear uno o varios eventos (repetición)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const dates = buildDates(startsAt, repeat)

    for (const date of dates) {
      const { error: err } = await supabase.from('events').insert({
        title,
        event_type_id: eventTypeId,
        starts_at: new Date(date).toISOString(),
        checkin_window_min: checkinWindowMin,
        target_sections: targetSections.length > 0 ? targetSections : null,
        notes: notes || null,
        created_by: user.id,
      })
      if (err) {
        setError(err.message)
        setLoading(false)
        return
      }
    }

    router.push('/eventos')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" data-hydrated={mounted ? 'true' : undefined}>
      <Field label="Título del evento">
        <input
          type="text"
          required
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Ej: Ensayo general — Teatro Municipal"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </Field>

      <Field label="Tipo de evento">
        <select
          required
          value={eventTypeId}
          onChange={e => setEventTypeId(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          {eventTypes.map(et => (
            <option key={et.id} value={et.id}>{et.name}</option>
          ))}
        </select>
      </Field>

      <Field label="Fecha y hora de inicio">
        <input
          type="datetime-local"
          required
          value={startsAt}
          onChange={e => setStartsAt(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </Field>

      <Field label="Ventana de check-in (minutos antes del inicio)">
        <input
          type="number"
          required
          min={5}
          max={240}
          value={checkinWindowMin}
          onChange={e => setCheckinWindowMin(Number(e.target.value))}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </Field>

      {!isEdit && (
        <Field label="Repetición">
          <div className="flex gap-2">
            {(['none', 'weekly', 'biweekly'] as RepeatMode[]).map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => setRepeat(mode)}
                className={`flex-1 py-2 rounded-xl text-sm border transition-colors ${
                  repeat === mode
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-white text-gray-600 border-gray-300'
                }`}
              >
                {mode === 'none' ? 'Sin repetir' : mode === 'weekly' ? 'Semanal' : 'Quincenal'}
              </button>
            ))}
          </div>
          {repeat !== 'none' && (
            <p className="text-xs text-gray-400 mt-1">
              Se crearán {repeat === 'weekly' ? '8 eventos (8 semanas)' : '4 eventos (8 semanas, cada 2)'}
            </p>
          )}
        </Field>
      )}

      <Field label="Secciones (vacío = todos los miembros)">
        <div className="flex flex-wrap gap-2">
          {SECTIONS.map(([sec, label]) => (
            <button
              key={sec}
              type="button"
              onClick={() => toggleSection(sec)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                targetSections.includes(sec)
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'bg-white text-gray-600 border-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {targetSections.length === 0 && (
          <p className="text-xs text-gray-400 mt-1">Aplica a todos los miembros</p>
        )}
      </Field>

      <Field label="Notas (opcional)">
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          placeholder="Información adicional..."
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </Field>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-violet-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50"
      >
        {loading
          ? isEdit ? 'Guardando...' : 'Creando...'
          : isEdit ? 'Guardar cambios' : 'Crear evento'}
      </button>
    </form>
  )
}

function buildDates(startsAt: string, repeat: RepeatMode): string[] {
  if (repeat === 'none') return [startsAt]
  const base = new Date(startsAt)
  const intervalDays = repeat === 'weekly' ? 7 : 14
  const count = repeat === 'weekly' ? 8 : 4
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(base)
    d.setDate(d.getDate() + i * intervalDays)
    const offset = d.getTimezoneOffset()
    d.setMinutes(d.getMinutes() - offset)
    return d.toISOString().slice(0, 16)
  })
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  )
}
