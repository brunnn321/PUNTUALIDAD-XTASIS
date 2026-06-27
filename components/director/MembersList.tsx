'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { UserX, UserCheck, CheckSquare, Square, X, UserMinus, UserPlus, Trash2 } from 'lucide-react'
import { setMembersActive, deleteMembersByIds } from '@/lib/actions/members'
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

  const allMembers = [...active, ...inactive]

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

  // Determinar qué acciones mostrar según la selección
  const selectedMembers = allMembers.filter(m => selected.has(m.id))
  const hasActive   = selectedMembers.some(m => m.active)
  const hasInactive = selectedMembers.some(m => !m.active)

  function handleSetActive(newActive: boolean) {
    const ids = selectedMembers
      .filter(m => (newActive ? !m.active : m.active))
      .map(m => m.id)
    if (ids.length === 0) return
    startTransition(async () => {
      await setMembersActive(ids, newActive)
      exitSelect()
      router.refresh()
    })
  }

  function handleDeleteSelected() {
    const ids = selectedMembers.filter(m => !m.active).map(m => m.id)
    if (ids.length === 0) return
    startTransition(async () => {
      await deleteMembersByIds(ids)
      exitSelect()
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {/* Botón de selección */}
      <div className="flex justify-end">
        {mode === 'view' ? (
          <button
            onClick={() => setMode('select')}
            className="flex items-center gap-1.5 text-sm text-brand-500 font-medium border border-brand-200 px-3 py-1.5 rounded-xl hover:bg-brand-50 transition-colors"
          >
            <CheckSquare size={14} /> Seleccionar
          </button>
        ) : (
          <button
            onClick={exitSelect}
            className="flex items-center gap-1.5 text-sm text-foreground/50 font-medium border border-foreground/12 px-3 py-1.5 rounded-xl hover:bg-foreground/4 transition-colors"
          >
            <X size={14} /> Cancelar
          </button>
        )}
      </div>

      {/* Lista activos */}
      <section className="space-y-3">
        {active.map(member => (
          <MemberRow
            key={member.id}
            member={member}
            mode={mode}
            selected={selected.has(member.id)}
            onToggle={() => toggleSelect(member.id)}
          />
        ))}
      </section>

      {inactive.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-foreground/30">Inactivos</span>
            <div className="flex-1 h-px bg-foreground/8" />
          </div>
          <div className="space-y-3 opacity-50">
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
        <div className="fixed bottom-20 left-0 right-0 px-4 z-40 animate-slide-up">
          <div className="max-w-lg mx-auto bg-foreground text-white rounded-2xl p-4 shadow-2xl space-y-3">
            <p className="text-sm font-medium text-center text-white/50">
              {selected.size} miembro{selected.size !== 1 ? 's' : ''} seleccionado{selected.size !== 1 ? 's' : ''}
            </p>
            {!confirmDelete ? (
              <div className="flex gap-2">
                {hasActive && (
                  <button
                    onClick={() => handleSetActive(false)}
                    disabled={isPending}
                    className="flex-1 flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50"
                  >
                    <UserMinus size={15} />
                    {isPending ? '...' : 'Desactivar'}
                  </button>
                )}
                {hasInactive && (
                  <button
                    onClick={() => handleSetActive(true)}
                    disabled={isPending}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50"
                  >
                    <UserPlus size={15} />
                    {isPending ? '...' : 'Reactivar'}
                  </button>
                )}
                {hasInactive && (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    disabled={isPending}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={15} />
                    Eliminar
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-center text-white/50">
                  ¿Eliminar {selectedMembers.filter(m => !m.active).length} miembro{selectedMembers.filter(m => !m.active).length !== 1 ? 's' : ''} inactivo{selectedMembers.filter(m => !m.active).length !== 1 ? 's' : ''} permanentemente?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteSelected}
                    disabled={isPending}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {isPending ? '...' : 'Sí'}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
                  >
                    No
                  </button>
                </div>
              </div>
            )}
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
    <div className={`flex items-center gap-3 bg-white rounded-xl p-3 border transition-colors shadow-e1 ${
      selected ? 'border-brand-400 bg-brand-50' : 'border-foreground/8'
    }`}>
      {mode === 'select' && (
        <span className={`flex-shrink-0 ${selected ? 'text-brand-500' : 'text-foreground/20'}`}>
          {selected ? <CheckSquare size={20} /> : <Square size={20} />}
        </span>
      )}
      {member.photo_url ? (
        <img src={member.photo_url} alt="" className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
      ) : (
        <div className="w-11 h-11 rounded-full bg-brand-100 flex items-center justify-center text-brand-500 font-bold flex-shrink-0">
          {member.full_name?.charAt(0)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{member.full_name}</p>
        <p className="text-xs text-foreground/40 mt-0.5">
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
