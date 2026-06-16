'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, ImageIcon, CheckCircle, X, AlertCircle } from 'lucide-react'
import { registerKioskAttendance } from '@/lib/actions/checkin'

type Phase = 'camera' | 'submitting' | 'done' | 'error'

interface Props {
  eventId: string
  member: { id: string; full_name: string }
  onClose: () => void
}

export default function KioskCamera({ eventId, member, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [phase, setPhase] = useState<Phase>('camera')
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
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch {
      setErrorMsg('No se pudo acceder a la cámara. Usa "Galería" o verifica los permisos del navegador.')
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }

  async function capturePhoto() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')!
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    stopCamera()
    await submit(dataUrl)
  }

  function handleGalleryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        // Las fotos de galería pueden pesar varios MB; se reescalan
        // y recomprimen antes de enviarlas al server action.
        const maxSize = 1080
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
        const canvas = canvasRef.current ?? document.createElement('canvas')
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        submit(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  async function submit(dataUrl: string) {
    setPhase('submitting')
    try {
      const result = await registerKioskAttendance(eventId, member.id, dataUrl)

      if (result?.error) {
        setErrorMsg(result.error)
        setPhase('error')
      } else {
        setPhase('done')
        setTimeout(() => {
          router.refresh()
          onClose()
        }, 1800)
      }
    } catch {
      setErrorMsg('No se pudo registrar la asistencia. Intenta de nuevo con una foto más liviana.')
      setPhase('error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 text-white bg-black/60">
        <button onClick={() => { stopCamera(); onClose() }} className="p-2 rounded-full hover:bg-white/10" aria-label="Cerrar">
          <X size={24} />
        </button>
        <p className="font-semibold text-sm">{member.full_name}</p>
        <div className="w-10" />
      </div>

      {/* Visor principal */}
      <div className="flex-1 relative overflow-hidden bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-opacity duration-200 ${phase === 'camera' ? 'opacity-100' : 'opacity-0 pointer-events-none absolute inset-0'}`}
          style={{ transform: 'scaleX(-1)' }}
        />

        {phase === 'submitting' && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-white text-center space-y-3">
              <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
              <p className="text-sm font-medium">Registrando asistencia...</p>
            </div>
          </div>
        )}

        {phase === 'done' && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4 text-white">
            <CheckCircle size={80} className="text-green-400" />
            <p className="text-2xl font-bold">¡Listo, {member.full_name.split(' ')[0]}!</p>
          </div>
        )}

        {phase === 'error' && (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4 px-8 text-center text-white">
            <AlertCircle size={56} className="text-red-400" />
            <p className="text-base">{errorMsg}</p>
            <button
              onClick={() => { setPhase('camera'); setErrorMsg(''); startCamera() }}
              className="mt-2 bg-white text-black px-8 py-3 rounded-xl font-semibold"
            >
              Reintentar
            </button>
          </div>
        )}

        {phase === 'camera' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 rounded-full border-2 border-white/40" />
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Controles inferiores: cámara (1 toque) o galería */}
      {phase === 'camera' && (
        <div className="p-8 flex items-center justify-center gap-6 bg-black">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-14 h-14 rounded-full bg-white/10 border border-white/30 flex items-center justify-center text-white"
            aria-label="Subir de galería"
          >
            <ImageIcon size={22} />
          </button>
          <button
            onClick={capturePhoto}
            className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            aria-label="Tomar foto"
          >
            <Camera size={34} className="text-gray-800" />
          </button>
          <div className="w-14" />
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleGalleryChange} />
    </div>
  )
}
