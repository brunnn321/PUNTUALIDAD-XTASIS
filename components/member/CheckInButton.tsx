'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { cn, fromNow } from '@/lib/utils'

interface Props {
  eventId: string
  isOpen: boolean
  opensAt: string
}

export default function CheckInButton({ eventId, isOpen, opensAt }: Props) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()

  async function handleCheckIn() {
    setLoading(true)
    setErrorMsg('')
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setErrorMsg('Sesión expirada. Recarga la página.')
      setLoading(false)
      return
    }

    const now = new Date().toISOString()

    const { data: statusResult } = await supabase.rpc('resolve_attendance_status', {
      p_event_id: eventId,
      p_checked_in_at: now,
    })

    // Upsert: si ya existe un registro (ej: marcado ausente por el director), lo actualiza
    const { error } = await supabase
      .from('attendances')
      .upsert(
        {
          event_id: eventId,
          user_id: user.id,
          status: statusResult ?? 'present',
          checked_in_at: now,
        },
        { onConflict: 'event_id,user_id' }
      )

    if (error) {
      setErrorMsg(`Error al registrar: ${error.message}`)
    } else {
      setDone(true)
      router.refresh()
    }
    setLoading(false)
  }

  if (done) {
    return (
      <div className="flex items-center justify-center gap-2 text-green-600 text-sm font-medium py-2">
        <CheckCircle size={18} />
        ¡Asistencia registrada!
      </div>
    )
  }

  if (!isOpen) {
    return (
      <div className="flex items-center justify-center gap-2 text-gray-400 text-sm py-2">
        <Clock size={16} />
        Abre {fromNow(opensAt)}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleCheckIn}
        disabled={loading}
        className={cn(
          'w-full py-3 rounded-xl font-semibold text-white transition-all',
          loading
            ? 'bg-violet-400 cursor-not-allowed'
            : 'bg-violet-600 hover:bg-violet-700 active:scale-95'
        )}
      >
        {loading ? 'Registrando...' : 'Marcar asistencia'}
      </button>
      {errorMsg && (
        <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 rounded-lg px-3 py-2">
          <AlertCircle size={14} />
          {errorMsg}
        </div>
      )}
    </div>
  )
}
