'use client'

import { useActionState } from 'react'
import { createMember } from '@/lib/actions/members'
import { SECTION_LABELS } from '@/lib/utils'
import type { SectionName } from '@/lib/supabase/types'
import Link from 'next/link'
import { ChevronLeft, UserPlus, AlertCircle } from 'lucide-react'

const SECTIONS = Object.entries(SECTION_LABELS) as [SectionName, string][]

export default function NuevoMiembroPage() {
  const [state, action, pending] = useActionState(createMember, null)

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24 space-y-5">
      <div>
        <Link href="/miembros" className="inline-flex items-center gap-1 text-sm text-brand-500 mb-4 btn-focus rounded-lg">
          <ChevronLeft size={16} /> Miembros
        </Link>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Nuevo miembro</h1>
        <p className="text-sm text-foreground/45 mt-0.5">
          El miembro podrá iniciar sesión con Google usando el correo registrado.
        </p>
      </div>

      <form action={action} className="space-y-4">
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
            placeholder="Ej: Juan Pérez"
            className="input-base btn-focus"
          />
        </Field>

        <Field label="Correo electrónico *">
          <input
            name="email"
            type="email"
            required
            placeholder="correo@gmail.com"
            className="input-base btn-focus"
          />
        </Field>

        <Field label="Sección *">
          <select
            name="section"
            required
            defaultValue=""
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
            placeholder="Ej: Trompeta"
            className="input-base btn-focus"
          />
        </Field>

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-brand-500 hover:bg-brand-600 active:scale-[0.98] text-white rounded-xl py-3 text-sm font-semibold transition-all duration-150 shadow-e1 btn-focus disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 mt-2"
        >
          {pending ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando…</>
          ) : (
            <><UserPlus size={16} /> Agregar miembro</>
          )}
        </button>
      </form>
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
