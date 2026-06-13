'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { EventStatus } from '@/lib/supabase/types'

export default function EventControls({ eventId, status }: { eventId: string; status: EventStatus }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function openEvent() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('events').update({ status: 'open' }).eq('id', eventId)
    router.refresh()
    setLoading(false)
  }

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
      {status === 'scheduled' && (
        <button
          onClick={openEvent}
          disabled={loading}
          className="flex-1 bg-green-600 text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-50"
        >
          Abrir check-in
        </button>
      )}
      {status === 'open' && (
        <div className="flex-1 bg-green-100 text-green-700 rounded-xl px-4 py-2.5 text-sm font-medium text-center">
          Check-in abierto
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
