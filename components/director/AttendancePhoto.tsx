'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

export default function AttendancePhoto({ url, name }: { url: string; name: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-10 h-10 rounded-lg overflow-hidden border-2 border-violet-200 hover:border-violet-400 transition-colors flex-shrink-0"
        title="Ver foto de asistencia"
      >
        <img src={url} alt={name} className="w-full h-full object-cover" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div className="relative max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setOpen(false)}
              className="absolute -top-10 right-0 text-white p-2 hover:text-gray-300"
            >
              <X size={24} />
            </button>
            <img
              src={url}
              alt={name}
              className="w-full rounded-2xl object-cover shadow-2xl"
            />
            <p className="text-white text-sm text-center mt-3 font-medium">{name}</p>
          </div>
        </div>
      )}
    </>
  )
}
