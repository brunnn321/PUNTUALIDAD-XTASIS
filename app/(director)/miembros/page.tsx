import { createClient } from '@/lib/supabase/server'
import MembersList from '@/components/director/MembersList'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function MiembrosPage() {
  const supabase = await createClient()
  const { data: members } = await supabase
    .from('profiles')
    .select('id, full_name, photo_url, section, instrument, active')
    .eq('role', 'member')
    .order('full_name')

  const active = members?.filter(m => m.active) ?? []
  const inactive = members?.filter(m => !m.active) ?? []

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
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

      <MembersList active={active} inactive={inactive} />
    </div>
  )
}
