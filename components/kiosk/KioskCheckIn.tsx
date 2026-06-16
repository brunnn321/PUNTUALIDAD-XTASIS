'use client'

import { useState } from 'react'
import { Music2 } from 'lucide-react'
import { SECTION_LABELS } from '@/lib/utils'
import type { SectionName } from '@/lib/supabase/types'
import KioskCamera from './KioskCamera'

type KioskMember = {
  id: string
  full_name: string
  photo_url: string | null
  section: SectionName | null
}

export default function KioskCheckIn({
  eventId,
  eventTitle,
  members,
}: {
  eventId: string
  eventTitle: string
  members: KioskMember[]
}) {
  const [selected, setSelected] = useState<KioskMember | null>(null)

  if (selected) {
    return (
      <KioskCamera
        eventId={eventId}
        member={selected}
        onClose={() => setSelected(null)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 max-w-lg mx-auto space-y-5">
        <div className="pt-6 text-center space-y-1">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-violet-100 mb-2">
            <Music2 size={26} className="text-violet-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Marca tu asistencia</h1>
          <p className="text-sm text-gray-500">{eventTitle}</p>
          <p className="text-xs text-gray-400">Toca tu nombre y toma una foto</p>
        </div>

        <div className="space-y-2">
          {members.length > 0 ? members.map(m => (
            <button
              key={m.id}
              onClick={() => setSelected(m)}
              className="w-full flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:border-violet-300 active:scale-[0.99] transition-all text-left"
            >
              {m.photo_url ? (
                <img src={m.photo_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-sm flex-shrink-0">
                  {m.full_name.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-medium text-gray-900 truncate">{m.full_name}</p>
                {m.section && (
                  <p className="text-xs text-gray-400">{SECTION_LABELS[m.section]}</p>
                )}
              </div>
            </button>
          )) : (
            <div className="bg-white rounded-xl p-8 text-center text-gray-400 border border-dashed border-gray-200">
              🎉 Todos ya marcaron su asistencia
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
