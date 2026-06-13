'use client'

import { useActionState } from 'react'
import { createMember } from '@/lib/actions/members'
import { SECTION_LABELS } from '@/lib/utils'
import type { SectionName } from '@/lib/supabase/types'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

const SECTIONS = Object.entries(SECTION_LABELS) as [SectionName, string][]

export default function NuevoMiembroPage() {
  const [state, action, pending] = useActionState(createMember, null)

  return (
    <div className="p-4 max-w-lg mx-auto space-y-5">
      <div className="pt-4">
        <Link href="/miembros" className="flex items-center gap-1 text-sm text-violet-600 mb-3">
          <ChevronLeft size={16} /> Miembros
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nuevo miembro</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          El miembro podrá iniciar sesión con Google usando el correo registrado.
        </p>
      </div>

      <form action={action} className="space-y-4">
        {state?.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {state.error}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Nombre completo *</label>
          <input
            name="full_name"
            type="text"
            required
            placeholder="Ej: Juan Pérez"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Correo electrónico *</label>
          <input
            name="email"
            type="email"
            required
            placeholder="correo@gmail.com"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Sección *</label>
          <select
            name="section"
            required
            defaultValue=""
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
          >
            <option value="" disabled>Selecciona una sección</option>
            {SECTIONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Instrumento <span className="text-gray-400">(opcional)</span></label>
          <input
            name="instrument"
            type="text"
            placeholder="Ej: Trompeta"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-violet-600 text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-50 mt-2"
        >
          {pending ? 'Guardando...' : 'Agregar miembro'}
        </button>
      </form>
    </div>
  )
}
