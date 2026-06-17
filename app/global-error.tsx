'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
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
    <html lang="es">
      <body className="min-h-screen flex flex-col items-center justify-center px-4 text-center gap-4 bg-gray-50">
        <h1 className="text-xl font-semibold text-gray-900">Algo salió mal</h1>
        <p className="text-sm text-gray-500">Ocurrió un error inesperado. Ya quedó registrado.</p>
        <button
          onClick={reset}
          className="px-4 py-2 rounded-xl bg-violet-700 text-white text-sm font-medium hover:bg-violet-800"
        >
          Reintentar
        </button>
      </body>
    </html>
  )
}
