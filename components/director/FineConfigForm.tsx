'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { EventType } from '@/lib/supabase/types'
import { formatCurrency } from '@/lib/utils'

export default function FineConfigForm({ eventTypes }: { eventTypes: EventType[] }) {
  const [types, setTypes] = useState(eventTypes)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const router = useRouter()

  async function saveFines(et: EventType) {
    setSaving(et.id)
    const supabase = createClient()
    await supabase
      .from('event_types')
      .update({ fine_absent: et.fine_absent, fine_late: et.fine_late })
      .eq('id', et.id)
    setSaving(null)
    setSaved(et.id)
    setTimeout(() => setSaved(null), 1500)
    router.refresh()
  }

  function updateFine(id: string, field: 'fine_absent' | 'fine_late', value: string) {
    setTypes(prev => prev.map(et =>
      et.id === id ? { ...et, [field]: Number(value) } : et
    ))
  }

  return (
    <div className="space-y-4">
      {types.map(et => (
        <div key={et.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
          <h3 className="font-semibold text-gray-900">{et.name}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Multa por falta</label>
              <input
                type="number"
                min="0"
                step="1000"
                value={et.fine_absent}
                onChange={e => updateFine(et.id, 'fine_absent', e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <p className="text-xs text-gray-400">{formatCurrency(et.fine_absent)}</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Multa por tardanza</label>
              <input
                type="number"
                min="0"
                step="1000"
                value={et.fine_late}
                onChange={e => updateFine(et.id, 'fine_late', e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <p className="text-xs text-gray-400">{formatCurrency(et.fine_late)}</p>
            </div>
          </div>
          <button
            onClick={() => saveFines(et)}
            disabled={saving === et.id}
            className="w-full bg-violet-600 text-white py-2 rounded-xl text-sm font-medium disabled:opacity-50"
          >
            {saved === et.id ? '¡Guardado!' : saving === et.id ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      ))}
    </div>
  )
}
