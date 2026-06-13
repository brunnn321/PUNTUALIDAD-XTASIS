'use client'

import { useState } from 'react'
import { Clock } from 'lucide-react'
import { cn, fromNow } from '@/lib/utils'
import CheckInCamera from './CheckInCamera'

interface Props {
  eventId: string
  isOpen: boolean
  opensAt: string
}

export default function CheckInButton({ eventId, isOpen, opensAt }: Props) {
  const [showCamera, setShowCamera] = useState(false)

  if (!isOpen) {
    return (
      <div className="flex items-center justify-center gap-2 text-gray-400 text-sm py-2">
        <Clock size={16} />
        Abre {fromNow(opensAt)}
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowCamera(true)}
        className={cn(
          'w-full py-3 rounded-xl font-semibold text-white transition-all',
          'bg-violet-600 hover:bg-violet-700 active:scale-95'
        )}
      >
        Marcar asistencia
      </button>

      {showCamera && (
        <CheckInCamera
          eventId={eventId}
          onClose={() => setShowCamera(false)}
        />
      )}
    </>
  )
}
