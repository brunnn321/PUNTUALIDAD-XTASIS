import { createClient } from '@/lib/supabase/server'
import MembersList from '@/components/director/MembersList'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import FetchError from '@/components/FetchError'

export default async function MiembrosPage() {
  const supabase = await createClient()
  const { data: members, error } = await supabase
    .from('profiles')
    .select('id, full_name, photo_url, section, instrument, active')
    .eq('role', 'member')
    .order('full_name')

  if (error) return <FetchError context="No se pudo cargar la lista de miembros" />

  const active = members?.filter(m => m.active) ?? []
  const inactive = members?.filter(m => !m.active) ?? []

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-24 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Miembros</h1>
          <p className="text-sm text-foreground/40 mt-0.5">{active.length} activos · {inactive.length} inactivos</p>
        </div>
        <Link
          href="/miembros/nuevo"
          className="flex items-center gap-1.5 bg-brand-500 text-white text-sm font-medium px-4 py-2 rounded-xl"
        >
          <Plus size={16} /> Nuevo
        </Link>
      </div>

      <MembersList active={active} inactive={inactive} />
    </div>
  )
}
