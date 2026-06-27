'use client'

import { RefreshCw, WifiOff } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  message?: string
  context?: string
}

export default function FetchError({ message, context }: Props) {
  const router = useRouter()

  return (
    <div className="max-w-lg mx-auto px-4 pt-20 pb-24 flex flex-col items-center text-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-foreground/6 flex items-center justify-center">
        <WifiOff size={24} className="text-foreground/30" />
      </div>
      <div className="space-y-1">
        <p className="font-semibold text-foreground">
          {context ?? 'No se pudieron cargar los datos'}
        </p>
        <p className="text-sm text-foreground/50">
          {message ?? 'Revisa tu conexión y vuelve a intentarlo.'}
        </p>
      </div>
      <button
        onClick={() => router.refresh()}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-foreground/6 hover:bg-foreground/10 text-sm font-medium text-foreground/70 transition-colors"
      >
        <RefreshCw size={15} />
        Reintentar
      </button>
    </div>
  )
}
