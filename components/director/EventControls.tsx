'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { EventStatus } from '@/lib/supabase/types'

interface Props {
  eventId: string
  status: EventStatus
  checkinOpensAt: string
  startsAt: string
}

export default function EventControls({ eventId, status, checkinOpensAt, startsAt }: Props) {
  const [loading, setLoading] = useState(false)
  const [notifying, setNotifying] = useState(false)
  const [notifyMsg, setNotifyMsg] = useState('')
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  useEffect(() => { setMounted(true) }, [])

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

  async function notifyMembers() {
    setNotifying(true)
    setNotifyMsg('')
    try {
      const res = await fetch('/api/push/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      })
      const data = await res.json()
      setNotifyMsg(`✓ Notificación enviada a ${data.sent ?? 0} miembro(s)`)
    } catch {
      setNotifyMsg('Error al enviar notificación')
    } finally {
      setNotifying(false)
    }
  }

  if (status === 'closed') {
    return (
      <div className="bg-foreground/6 text-foreground/40 rounded-xl px-4 py-2.5 text-sm text-center font-medium">
        Evento cerrado
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2" data-hydrated={mounted ? 'true' : undefined}>
      <div className="flex gap-2">
        {isTimeOpen ? (
          <div className="flex-1 bg-green-100 text-green-700 rounded-xl px-4 py-2.5 text-sm font-medium text-center">
            Check-in abierto automáticamente
          </div>
        ) : now < opensAt ? (
          <div className="flex-1 bg-foreground/6 text-foreground/40 rounded-xl px-4 py-2.5 text-sm text-center">
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
          className="flex-1 bg-red-600 hover:bg-red-700 active:scale-95 active:bg-red-800 text-white rounded-xl py-2.5 text-sm font-medium transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Cerrando…
            </span>
          ) : 'Cerrar y registrar ausentes'}
        </button>
      </div>
      <div className="flex gap-2">
      <button
        onClick={notifyMembers}
        disabled={notifying}
        className="w-full bg-brand-500 hover:bg-brand-600 active:scale-95 active:bg-brand-700 text-white rounded-xl py-2.5 text-sm font-medium transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none"
      >
        {notifying ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Enviando…
          </span>
        ) : '🔔 Notificar miembros'}
      </button>
      <Link
          href={`/eventos/${eventId}/editar`}
          className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-2.5 text-sm font-medium text-center hover:bg-gray-200 transition-colors"
        >
          ✏️ Editar
        </Link>
        </div>
      {notifyMsg && (
        <p className="text-xs text-center text-foreground/40">{notifyMsg}</p>
      )}
    </div>
  )
}
