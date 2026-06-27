'use client'

import { useActionState, useState, useTransition, use } from 'react'
import { updateMember, deleteMember } from '@/lib/actions/members'
import { SECTION_LABELS } from '@/lib/utils'
import type { SectionName } from '@/lib/supabase/types'
import Link from 'next/link'
import { ChevronLeft, Trash2, Check, AlertCircle } from 'lucide-react'

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
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24 space-y-5">
      <div>
        <Link href={`/miembros/${id}`} className="inline-flex items-center gap-1 text-sm text-brand-500 mb-4 btn-focus rounded-lg">
          <ChevronLeft size={16} /> Detalle
        </Link>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Editar miembro</h1>
      </div>

      <form action={action} className="space-y-4">
        <input type="hidden" name="id" value={id} />

        {state?.error && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{state.error}</p>
          </div>
        )}

        <Field label="Nombre completo *">
          <input
            name="full_name"
            type="text"
            required
            defaultValue={sp.name ?? ''}
            className="input-base btn-focus"
          />
        </Field>

        <Field label="Sección *">
          <select
            name="section"
            required
            defaultValue={sp.section ?? ''}
            className="input-base btn-focus bg-white"
          >
            <option value="" disabled>Selecciona una sección</option>
            {SECTIONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </Field>

        <Field label={<>Instrumento <span className="text-foreground/35 font-normal">— opcional</span></>}>
          <input
            name="instrument"
            type="text"
            defaultValue={sp.instrument ?? ''}
            className="input-base btn-focus"
          />
        </Field>

        {/* Toggle activo */}
        <div className="bg-white rounded-xl px-4 py-3 border border-foreground/8 shadow-e1 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground">Miembro activo</p>
            <p className="text-xs text-foreground/40 mt-0.5">
              {active ? 'Aparece en eventos y puede marcar asistencia' : 'No aparece en eventos nuevos'}
            </p>
          </div>
          <input type="hidden" name="active" value={String(active)} />
          <button
            type="button"
            onClick={() => setActive(v => !v)}
            role="switch"
            aria-checked={active}
            className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors duration-200 btn-focus ${active ? 'bg-brand-500' : 'bg-foreground/20'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-e1 transition-transform duration-200 ${active ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-brand-500 hover:bg-brand-600 active:scale-[0.98] text-white rounded-xl py-3 text-sm font-semibold transition-all duration-150 shadow-e1 btn-focus disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
        >
          {pending ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando…</>
          ) : <><Check size={16} /> Guardar cambios</>}
        </button>
      </form>

      {/* Zona de peligro */}
      <div className="border border-red-100 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 bg-red-50 border-b border-red-100">
          <p className="text-sm font-semibold text-red-700">Zona de peligro</p>
        </div>
        <div className="px-4 py-3">
          {!confirming ? (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="flex items-center gap-2 text-sm text-red-600 font-medium hover:text-red-700 transition-colors btn-focus rounded-lg py-1"
            >
              <Trash2 size={15} /> Eliminar miembro permanentemente
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-foreground/60">¿Seguro? Se eliminarán todos sus datos y registros de asistencia.</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white rounded-xl py-2.5 text-sm font-semibold transition-all duration-150 disabled:opacity-50 btn-focus"
                >
                  {deleting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Eliminando…
                    </span>
                  ) : 'Sí, eliminar'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="flex-1 bg-foreground/6 hover:bg-foreground/10 text-foreground/70 rounded-xl py-2.5 text-sm font-medium transition-colors btn-focus"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-foreground/65">{label}</label>
      {children}
    </div>
  )
}
