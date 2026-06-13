import { createClient } from '@/lib/supabase/server'
import { SECTION_LABELS } from '@/lib/utils'
import type { SectionName } from '@/lib/supabase/types'
import Link from 'next/link'
import { UserX, UserCheck, Plus } from 'lucide-react'

export default async function MiembrosPage() {
  const supabase = await createClient()
  const { data: members } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'member')
    .order('full_name')

  const active = members?.filter(m => m.active) ?? []
  const inactive = members?.filter(m => !m.active) ?? []

  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto">
      <div className="pt-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Miembros</h1>
          <p className="text-sm text-gray-500">{active.length} activos · {inactive.length} inactivos</p>
        </div>
        <Link
          href="/miembros/nuevo"
          className="flex items-center gap-1.5 bg-violet-600 text-white text-sm font-medium px-4 py-2 rounded-xl"
        >
          <Plus size={16} /> Nuevo
        </Link>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Activos</h2>
        <div className="space-y-2">
          {active.map(member => (
            <MemberRow key={member.id} member={member} />
          ))}
        </div>
      </section>

      {inactive.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Inactivos</h2>
          <div className="space-y-2 opacity-60">
            {inactive.map(member => (
              <MemberRow key={member.id} member={member} />
            ))}
          </div>
        </section>
      )}

    </div>
  )
}

function MemberRow({ member }: { member: any }) {
  return (
    <Link
      href={`/miembros/${member.id}`}
      className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm border border-gray-100"
    >
      {member.photo_url ? (
        <img src={member.photo_url} alt="" className="w-11 h-11 rounded-full object-cover" />
      ) : (
        <div className="w-11 h-11 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold">
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
    </Link>
  )
}
