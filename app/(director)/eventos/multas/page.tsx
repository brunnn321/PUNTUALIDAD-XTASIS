import { createClient } from '@/lib/supabase/server'
import FineConfigForm from '@/components/director/FineConfigForm'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function MultasConfigPage() {
  const supabase = await createClient()
  const { data: eventTypes } = await supabase
    .from('event_types')
    .select('*')
    .order('name')

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="pt-4 mb-6">
        <Link href="/eventos" className="flex items-center gap-1 text-sm text-violet-600 mb-3">
          <ChevronLeft size={16} /> Eventos
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Multas</h1>
        <p className="text-sm text-gray-500 mt-1">Montos de multas por tipo de evento</p>
      </div>
      <FineConfigForm eventTypes={eventTypes ?? []} />
    </div>
  )
}
