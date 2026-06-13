'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { EventStatus } from '@/lib/supabase/types'

interface Props {
  eventId: string
  status: EventStatus
  checkinOpensAt: string
  startsAt: string
}

export default function EventControls({ eventId, status, checkinOpensAt, startsAt }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const now = Date.now()
  const opensAt = new Date(checkinOpensAt).getTime()
  const closesAt = new Date(startsAt).getTime() + 60 * 60 * 1000
  const isTimeOpen = now >= opensAt && now < closesAt

  async function closeEvent() {
    setLoading(true)
    const supabase = createClient()
    await supabase.rpc('close_event', { p_event_id: eventId })
    router.refresh()
    setLoading(false)
  }

  if (status === 'closed') {
    return (
      <div className="bg-gray-100 text-gray-500 rounded-xl px-4 py-2.5 text-sm text-center font-medium">
        Evento cerrado
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      {isTimeOpen ? (
        <div className="flex-1 bg-green-100 text-green-700 rounded-xl px-4 py-2.5 text-sm font-medium text-center">
          Check-in abierto automáticamente
        </div>
      ) : now < opensAt ? (
        <div className="flex-1 bg-gray-100 text-gray-500 rounded-xl px-4 py-2.5 text-sm text-center">
          Check-in abre a las {new Date(checkinOpensAt).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}
        </div>
      ) : (
        <div className="flex-1 bg-amber-100 text-amber-700 rounded-xl px-4 py-2.5 text-sm text-center">
          Ventana de check-in cerrada
        </div>
      )}
      <button
        onClick={closeEvent}
        disabled={loading}
        className="flex-1 bg-red-600 text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-50"
      >
        Cerrar y registrar ausentes
      </button>
    </div>
  )
}
