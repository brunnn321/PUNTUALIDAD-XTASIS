'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center gap-4">
      <h1 className="text-xl font-semibold text-foreground">Algo salió mal</h1>
      <p className="text-sm text-foreground/50">Ocurrió un error inesperado. Ya quedó registrado.</p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700"
      >
        Reintentar
      </button>
    </div>
  )
}
