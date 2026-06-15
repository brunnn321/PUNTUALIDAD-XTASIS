'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { UserX, UserCheck, CheckSquare, Square, X, Trash2, CalendarPlus } from 'lucide-react'
import { deleteMemberById } from '@/lib/actions/members'
import { SECTION_LABELS } from '@/lib/utils'
import type { SectionName } from '@/lib/supabase/types'

type Member = {
  id: string
  full_name: string | null
  photo_url: string | null
  section: string | null
  instrument: string | null
  active: boolean | null
}

export default function MembersList({
  active,
  inactive,
}: {
  active: Member[]
  inactive: Member[]
}) {
  const [mode, setMode] = useState<'view' | 'select'>('view')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function exitSelect() {
    setMode('view')
    setSelected(new Set())
    setConfirmDelete(false)
  }

  function handleCreateEvent() {
    const allMembers = [...active, ...inactive]
    const sections = [...new Set(
      allMembers
        .filter(m => selected.has(m.id) && m.section)
        .map(m => m.section as string)
    )]
    const query = sections.length > 0 ? `?sections=${sections.join(',')}` : ''
    router.push(`/eventos/nuevo${query}`)
  }

  async function handleDeleteSelected() {
    startTransition(async () => {
      for (const id of selected) {
        await deleteMemberById(id)
      }
      exitSelect()
      router.refresh()
    })
  }

  const allMembers = [...active, ...inactive]

  return (
    <div className="space-y-6">
      {/* Botón de selección */}
      <div className="flex justify-end">
        {mode === 'view' ? (
          <button
            onClick={() => setMode('select')}
            className="flex items-center gap-1.5 text-sm text-violet-600 font-medium border border-violet-200 px-3 py-1.5 rounded-xl hover:bg-violet-50 transition-colors"
          >
            <CheckSquare size={14} /> Seleccionar
          </button>
        ) : (
          <button
            onClick={exitSelect}
            className="flex items-center gap-1.5 text-sm text-gray-500 font-medium border border-gray-200 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <X size={14} /> Cancelar
          </button>
        )}
      </div>

      {/* Lista activos */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Activos</h2>
        <div className="space-y-2">
          {active.map(member => (
            <MemberRow
              key={member.id}
              member={member}
              mode={mode}
              selected={selected.has(member.id)}
              onToggle={() => toggleSelect(member.id)}
            />
          ))}
        </div>
      </section>

      {inactive.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Inactivos</h2>
          <div className="space-y-2 opacity-60">
            {inactive.map(member => (
              <MemberRow
                key={member.id}
                member={member}
                mode={mode}
                selected={selected.has(member.id)}
                onToggle={() => toggleSelect(member.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Barra de acciones en modo selección */}
      {mode === 'select' && selected.size > 0 && (
        <div className="fixed bottom-20 left-0 right-0 px-4 z-40">
          <div className="max-w-lg mx-auto bg-gray-900 text-white rounded-2xl p-4 shadow-2xl space-y-3">
            <p className="text-sm font-medium text-center text-gray-300">
              {selected.size} miembro{selected.size !== 1 ? 's' : ''} seleccionado{selected.size !== 1 ? 's' : ''}
            </p>

            <div className="flex gap-2">
              <button
                onClick={handleCreateEvent}
                className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
              >
                <CalendarPlus size={15} /> Crear evento
              </button>

              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
                >
                  <Trash2 size={15} /> Eliminar
                </button>
              ) : (
                <div className="flex-1 flex gap-2">
                  <button
                    onClick={handleDeleteSelected}
                    disabled={isPending}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {isPending ? '...' : 'Sí'}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
                  >
                    No
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MemberRow({
  member,
  mode,
  selected,
  onToggle,
}: {
  member: Member
  mode: 'view' | 'select'
  selected: boolean
  onToggle: () => void
}) {
  const inner = (
    <div className={`flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm border transition-colors ${
      selected ? 'border-violet-400 bg-violet-50' : 'border-gray-100'
    }`}>
      {mode === 'select' && (
        <span className={`flex-shrink-0 ${selected ? 'text-violet-600' : 'text-gray-300'}`}>
          {selected ? <CheckSquare size={20} /> : <Square size={20} />}
        </span>
      )}
      {member.photo_url ? (
        <img src={member.photo_url} alt="" className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
      ) : (
        <div className="w-11 h-11 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold flex-shrink-0">
          {member.full_name?.charAt(0)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{member.full_name}</p>
        <p className="text-xs text-gray-400">
          {member.section ? SECTION_LABELS[member.section as SectionName] : 'Sin sección'}
          {member.instrument ? ` · ${member.instrument}` : ''}
        </p>
      </div>
      {member.active ? (
        <UserCheck size={16} className="text-green-500 flex-shrink-0" />
      ) : (
        <UserX size={16} className="text-red-400 flex-shrink-0" />
      )}
    </div>
  )

  if (mode === 'select') {
    return (
      <button type="button" onClick={onToggle} className="w-full text-left">
        {inner}
      </button>
    )
  }

  return <Link href={`/miembros/${member.id}`}>{inner}</Link>
}
