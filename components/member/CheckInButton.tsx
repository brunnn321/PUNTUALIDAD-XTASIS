'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { Clock, Camera, ImageIcon, CheckCircle, AlertCircle, RotateCcw } from 'lucide-react'
import { fromNow } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import CheckInCamera from './CheckInCamera'

interface Props {
  eventId: string
  eventTitle?: string
  isOpen: boolean
  opensAt: string
  autoOpen?: boolean
}

export default function CheckInButton({ eventId, eventTitle, isOpen, opensAt, autoOpen = false }: Props) {
  const [showCamera, setShowCamera] = useState(autoOpen && isOpen)
  const [galleryPhoto, setGalleryPhoto] = useState<string | null>(null)
  const [submitting, startSubmit] = useTransition()
  const [done, setDone] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  useEffect(() => { setMounted(true) }, [])

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
      <div className="flex items-center justify-center gap-2.5 py-3 animate-scale-in">
        <span className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center animate-success-pop flex-shrink-0">
          <CheckCircle size={14} className="text-white" />
        </span>
        <span className="text-sm font-semibold text-green-700">¡Asistencia registrada!</span>
      </div>
    )
  }

  if (!isOpen) {
    return (
      <div className="flex items-center justify-center gap-2 text-foreground/40 text-sm py-2">
        <Clock size={16} /> Abre {fromNow(opensAt)}
      </div>
    )
  }

  // Preview compacto de foto de galería
  if (galleryPhoto) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 bg-foreground/4 rounded-xl p-3 border border-foreground/12">
          <img src={galleryPhoto} alt="Vista previa" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">¿Usar esta foto?</p>
            <p className="text-xs text-foreground/40 mt-0.5">Se adjuntará a tu asistencia</p>
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
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-foreground/12 text-foreground/60 text-sm font-medium hover:bg-foreground/4 active:scale-95 transition-all duration-150"
          >
            <RotateCcw size={15} /> Cambiar
          </button>
          <button
            onClick={confirmGallery}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-95 active:bg-brand-700 text-white text-sm font-semibold transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Registrando…
              </span>
            ) : 'Confirmar'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex gap-2" data-hydrated={mounted ? 'true' : undefined}>
        <button
          onClick={() => setShowCamera(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white bg-brand-500 hover:bg-brand-600 active:scale-95 transition-all"
        >
          <Camera size={18} /> Cámara
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-brand-500 bg-brand-50 border border-brand-200 hover:bg-brand-100 active:scale-95 transition-all"
        >
          <ImageIcon size={18} /> Galería
        </button>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleGalleryChange} />

      {showCamera && (
        <CheckInCamera
          eventId={eventId}
          eventTitle={eventTitle}
          onClose={() => setShowCamera(false)}
        />
      )}
    </>
  )
}
