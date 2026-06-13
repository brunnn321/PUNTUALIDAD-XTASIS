'use client'

import { useActionState, useState, useTransition, use } from 'react'
import { updateMember, deleteMember } from '@/lib/actions/members'
import { SECTION_LABELS } from '@/lib/utils'
import type { SectionName } from '@/lib/supabase/types'
import Link from 'next/link'
import { ChevronLeft, Trash2 } from 'lucide-react'

const SECTIONS = Object.entries(SECTION_LABELS) as [SectionName, string][]

interface Props {
  searchParams: Promise<{ name?: string; section?: string; instrument?: string; active?: string }>
  params: Promise<{ id: string }>
}

export default function EditarMiembroPage({ params, searchParams }: Props) {
  const { id } = use(params)
  const sp = use(searchParams)
  const [state, action, pending] = useActionState(updateMember, null)
  const [active, setActive] = useState(sp.active !== 'false')
  const [confirming, setConfirming] = useState(false)
  const [deleting, startDelete] = useTransition()

  function handleDelete() {
    startDelete(async () => {
      await deleteMember(id)
    })
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-5">
      <div className="pt-4">
        <Link href={`/miembros/${id}`} className="flex items-center gap-1 text-sm text-violet-600 mb-3">
          <ChevronLeft size={16} /> Detalle
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Editar miembro</h1>
      </div>

      <form action={action} className="space-y-4">
        <input type="hidden" name="id" value={id} />

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
            defaultValue={sp.name ?? ''}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Sección *</label>
          <select
            name="section"
            required
            defaultValue={sp.section ?? ''}
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
            defaultValue={sp.instrument ?? ''}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <div className="bg-white rounded-xl px-4 py-3 border border-gray-200 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Miembro activo</p>
            <p className="text-xs text-gray-400">{active ? 'Puede marcar asistencia' : 'No aparece en eventos'}</p>
          </div>
          <input type="hidden" name="active" value={String(active)} />
          <button
            type="button"
            onClick={() => setActive(v => !v)}
            className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${active ? 'bg-violet-600' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${active ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-violet-600 text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-50"
        >
          {pending ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>

      {/* Zona de peligro */}
      <div className="border border-red-200 rounded-2xl p-4 space-y-3">
        <p className="text-sm font-medium text-red-700">Zona de peligro</p>
        {!confirming ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="flex items-center gap-2 text-sm text-red-600 font-medium"
          >
            <Trash2 size={15} /> Eliminar miembro
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">¿Seguro? Se eliminarán todos sus datos y registros de asistencia.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50"
              >
                {deleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-2.5 text-sm font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
