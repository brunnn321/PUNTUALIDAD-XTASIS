'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { EventType, SectionName } from '@/lib/supabase/types'
import { SECTION_LABELS } from '@/lib/utils'

const SECTIONS = Object.entries(SECTION_LABELS) as [SectionName, string][]

export default function EventForm({ eventTypes }: { eventTypes: EventType[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [title, setTitle] = useState('')
  const [eventTypeId, setEventTypeId] = useState(eventTypes[0]?.id ?? '')
  const [startsAt, setStartsAt] = useState('')
  const [checkinWindowMin, setCheckinWindowMin] = useState(60)
  const [notes, setNotes] = useState('')
  const [targetSections, setTargetSections] = useState<SectionName[]>([]) // vacío = todos

  function toggleSection(sec: SectionName) {
    setTargetSections(prev =>
      prev.includes(sec) ? prev.filter(s => s !== sec) : [...prev, sec]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error: err } = await supabase.from('events').insert({
      title,
      event_type_id: eventTypeId,
      starts_at: new Date(startsAt).toISOString(),
      checkin_window_min: checkinWindowMin,
      target_sections: targetSections.length > 0 ? targetSections : null,
      notes: notes || null,
      created_by: user.id,
    })

    if (err) {
      setError(err.message)
    } else {
      router.push('/eventos')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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

      <Field label={`Ventana de check-in: ${checkinWindowMin} min antes`}>
        <input
          type="range"
          min={15}
          max={120}
          step={15}
          value={checkinWindowMin}
          onChange={e => setCheckinWindowMin(Number(e.target.value))}
          className="w-full accent-violet-600"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>15 min</span><span>2 h</span>
        </div>
      </Field>

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
        {loading ? 'Creando...' : 'Crear evento'}
      </button>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  )
}
