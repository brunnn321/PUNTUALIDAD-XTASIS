'use client'

import { useRef, useState, useTransition } from 'react'
import { Clock, Camera, ImageIcon, CheckCircle, AlertCircle, RotateCcw } from 'lucide-react'
import { fromNow } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import CheckInCamera from './CheckInCamera'

interface Props {
  eventId: string
  isOpen: boolean
  opensAt: string
  autoOpen?: boolean
}

export default function CheckInButton({ eventId, isOpen, opensAt, autoOpen = false }: Props) {
  const [showCamera, setShowCamera] = useState(autoOpen && isOpen)
  const [galleryPhoto, setGalleryPhoto] = useState<string | null>(null)
  const [submitting, startSubmit] = useTransition()
  const [done, setDone] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function handleGalleryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setGalleryPhoto(reader.result as string)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function confirmGallery() {
    startSubmit(async () => {
      setErrorMsg('')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setErrorMsg('Sesión expirada. Recarga la página.'); return }

      const now = new Date().toISOString()
      const { data: statusResult } = await supabase.rpc('resolve_attendance_status', {
        p_event_id: eventId,
        p_checked_in_at: now,
      })

      let photoUrl: string | null = null
      try {
        const res = await fetch(galleryPhoto!)
        const blob = await res.blob()
        const fileName = `${user.id}/${eventId}/${Date.now()}.jpg`
        const { error: uploadError } = await supabase.storage
          .from('attendance-photos')
          .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true })
        if (!uploadError) {
          const { data } = supabase.storage.from('attendance-photos').getPublicUrl(fileName)
          photoUrl = data.publicUrl
        }
      } catch { /* sigue sin foto */ }

      const { error } = await supabase.from('attendances').upsert(
        { event_id: eventId, user_id: user.id, status: statusResult ?? 'present', checked_in_at: now, photo_url: photoUrl },
        { onConflict: 'event_id,user_id' }
      )

      if (error) {
        setErrorMsg(`Error: ${error.message}`)
      } else {
        setGalleryPhoto(null)
        setDone(true)
        router.refresh()
      }
    })
  }

  if (done) {
    return (
      <div className="flex items-center justify-center gap-2 text-green-600 text-sm font-medium py-2">
        <CheckCircle size={18} /> ¡Asistencia registrada!
      </div>
    )
  }

  if (!isOpen) {
    return (
      <div className="flex items-center justify-center gap-2 text-gray-400 text-sm py-2">
        <Clock size={16} /> Abre {fromNow(opensAt)}
      </div>
    )
  }

  // Preview compacto de foto de galería
  if (galleryPhoto) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-200">
          <img src={galleryPhoto} alt="Vista previa" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800">¿Usar esta foto?</p>
            <p className="text-xs text-gray-400 mt-0.5">Se adjuntará a tu asistencia</p>
          </div>
        </div>
        {errorMsg && (
          <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 rounded-lg px-3 py-2">
            <AlertCircle size={14} /> {errorMsg}
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => { setGalleryPhoto(null); setErrorMsg('') }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium"
          >
            <RotateCcw size={15} /> Cambiar
          </button>
          <button
            onClick={confirmGallery}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold disabled:opacity-50"
          >
            {submitting ? 'Registrando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={() => setShowCamera(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white bg-violet-600 hover:bg-violet-700 active:scale-95 transition-all"
        >
          <Camera size={18} /> Cámara
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-violet-600 bg-violet-50 border border-violet-200 hover:bg-violet-100 active:scale-95 transition-all"
        >
          <ImageIcon size={18} /> Galería
        </button>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleGalleryChange} />

      {showCamera && (
        <CheckInCamera
          eventId={eventId}
          onClose={() => setShowCamera(false)}
        />
      )}
    </>
  )
}
