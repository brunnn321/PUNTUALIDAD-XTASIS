'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Camera, RotateCcw, CheckCircle, X, AlertCircle } from 'lucide-react'

type Phase = 'camera' | 'preview' | 'submitting' | 'done' | 'error'

interface Props {
  eventId: string
  onClose: () => void
}

export default function CheckInCamera({ eventId, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [phase, setPhase] = useState<Phase>('camera')
  const [photoDataUrl, setPhotoDataUrl] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch {
      setErrorMsg('No se pudo acceder a la cámara. Verifica los permisos del navegador.')
      setPhase('error')
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  function capturePhoto() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')!
    // Espejo horizontal para que coincida con lo que el usuario ve en pantalla
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0)

    setPhotoDataUrl(canvas.toDataURL('image/jpeg', 0.85))
    stopCamera()
    setPhase('preview')
  }

  function retakePhoto() {
    setPhotoDataUrl('')
    setErrorMsg('')
    setPhase('camera')
    startCamera()
  }

  async function confirmCheckIn() {
    setPhase('submitting')
    setErrorMsg('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setErrorMsg('Sesión expirada. Recarga la página.')
      setPhase('preview')
      return
    }

    // Subir foto a Storage
    let photoUrl: string | null = null
    try {
      const res = await fetch(photoDataUrl)
      const blob = await res.blob()
      const fileName = `${user.id}/${eventId}/${Date.now()}.jpg`

      const { error: uploadError } = await supabase.storage
        .from('attendance-photos')
        .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true })

      if (!uploadError) {
        const { data } = supabase.storage.from('attendance-photos').getPublicUrl(fileName)
        photoUrl = data.publicUrl
      }
    } catch {
      // Si falla la foto, se registra igualmente sin foto
    }

    // Registrar asistencia
    const now = new Date().toISOString()
    const { data: statusResult } = await supabase.rpc('resolve_attendance_status', {
      p_event_id: eventId,
      p_checked_in_at: now,
    })

    const { error } = await supabase
      .from('attendances')
      .upsert(
        {
          event_id: eventId,
          user_id: user.id,
          status: statusResult ?? 'present',
          checked_in_at: now,
          photo_url: photoUrl,
        },
        { onConflict: 'event_id,user_id' }
      )

    if (error) {
      setErrorMsg(`Error al registrar: ${error.message}`)
      setPhase('preview')
    } else {
      setPhase('done')
      setTimeout(() => {
        onClose()
        router.refresh()
      }, 1800)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 text-white bg-black/60">
        <button
          onClick={() => { stopCamera(); onClose() }}
          className="p-2 rounded-full hover:bg-white/10"
          aria-label="Cerrar"
        >
          <X size={24} />
        </button>
        <p className="font-semibold text-sm">
          {phase === 'camera' && 'Toma una foto'}
          {phase === 'preview' && '¿Usar esta foto?'}
          {phase === 'submitting' && 'Registrando...'}
        </p>
        <div className="w-10" />
      </div>

      {/* Visor principal */}
      <div className="flex-1 relative overflow-hidden bg-black">
        {/* Cámara en vivo */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-opacity duration-200 ${phase === 'camera' ? 'opacity-100' : 'opacity-0 pointer-events-none absolute inset-0'}`}
          style={{ transform: 'scaleX(-1)' }}
        />

        {/* Preview de la foto */}
        {(phase === 'preview' || phase === 'submitting') && photoDataUrl && (
          <img
            src={photoDataUrl}
            alt="Foto tomada"
            className="w-full h-full object-cover"
          />
        )}

        {/* Overlay de cargando */}
        {phase === 'submitting' && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-white text-center space-y-3">
              <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
              <p className="text-sm font-medium">Registrando asistencia...</p>
            </div>
          </div>
        )}

        {/* Éxito */}
        {phase === 'done' && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4 text-white">
            <CheckCircle size={80} className="text-green-400" />
            <p className="text-2xl font-bold">¡Asistencia registrada!</p>
          </div>
        )}

        {/* Error de cámara */}
        {phase === 'error' && (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4 px-8 text-center text-white">
            <AlertCircle size={56} className="text-red-400" />
            <p className="text-base">{errorMsg}</p>
            <button
              onClick={() => { stopCamera(); onClose() }}
              className="mt-2 bg-white text-black px-8 py-3 rounded-xl font-semibold"
            >
              Volver
            </button>
          </div>
        )}

        {/* Marco guía para la cara */}
        {phase === 'camera' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 rounded-full border-2 border-white/40" />
          </div>
        )}
      </div>

      {/* Canvas oculto para captura */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Controles inferiores */}
      {phase === 'camera' && (
        <div className="p-8 flex flex-col items-center gap-3 bg-black">
          <p className="text-white/60 text-xs">Centra tu cara en el círculo</p>
          <button
            onClick={capturePhoto}
            className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            aria-label="Tomar foto"
          >
            <Camera size={34} className="text-gray-800" />
          </button>
        </div>
      )}

      {phase === 'preview' && (
        <div className="p-5 flex gap-3 bg-black">
          {errorMsg && (
            <div className="absolute bottom-24 left-4 right-4 bg-red-900/80 text-white text-xs rounded-xl px-4 py-3 text-center">
              {errorMsg}
            </div>
          )}
          <button
            onClick={retakePhoto}
            className="flex-1 py-3.5 rounded-xl border border-white/40 text-white font-semibold flex items-center justify-center gap-2 active:bg-white/10"
          >
            <RotateCcw size={18} />
            Nueva foto
          </button>
          <button
            onClick={confirmCheckIn}
            className="flex-1 py-3.5 rounded-xl bg-violet-600 text-white font-semibold active:bg-violet-700 active:scale-95 transition-all"
          >
            Ingresar asistencia
          </button>
        </div>
      )}
    </div>
  )
}
