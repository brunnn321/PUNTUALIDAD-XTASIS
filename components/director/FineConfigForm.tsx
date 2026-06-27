'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { EventType } from '@/lib/supabase/types'
import { formatCurrency } from '@/lib/utils'
import { Check } from 'lucide-react'

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
    setTimeout(() => setSaved(null), 2000)
    router.refresh()
  }

  function updateFine(id: string, field: 'fine_absent' | 'fine_late', value: string) {
    setTypes(prev => prev.map(et =>
      et.id === id ? { ...et, [field]: Number(value) } : et
    ))
  }

  return (
    <div className="space-y-3">
      {types.map(et => (
        <div key={et.id} className="bg-white rounded-2xl border border-foreground/8 shadow-e1 overflow-hidden">
          <div className="px-4 py-3 border-b border-foreground/6">
            <h3 className="font-semibold text-foreground text-sm">{et.name}</h3>
          </div>
          <div className="px-4 py-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground/50">Multa por falta</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={et.fine_absent}
                  onChange={e => updateFine(et.id, 'fine_absent', e.target.value)}
                  className="input-base btn-focus py-2 text-sm"
                />
                <p className="text-xs text-foreground/35 tabular-nums">{formatCurrency(et.fine_absent)}</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground/50">Multa por tardanza</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={et.fine_late}
                  onChange={e => updateFine(et.id, 'fine_late', e.target.value)}
                  className="input-base btn-focus py-2 text-sm"
                />
                <p className="text-xs text-foreground/35 tabular-nums">{formatCurrency(et.fine_late)}</p>
              </div>
            </div>
            <button
              onClick={() => saveFines(et)}
              disabled={saving === et.id}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 btn-focus flex items-center justify-center gap-2 ${
                saved === et.id
                  ? 'bg-green-500 text-white'
                  : 'bg-brand-500 hover:bg-brand-600 active:scale-[0.98] text-white disabled:opacity-50 disabled:pointer-events-none'
              }`}
            >
              {saved === et.id ? (
                <><Check size={15} /> Guardado</>
              ) : saving === et.id ? (
                <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando…</>
              ) : 'Guardar'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
