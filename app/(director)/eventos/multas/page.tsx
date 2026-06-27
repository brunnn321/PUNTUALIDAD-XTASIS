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
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
      <div className="mb-6">
        <Link href="/eventos" className="flex items-center gap-1 text-sm text-brand-500 mb-3">
          <ChevronLeft size={16} /> Eventos
        </Link>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Multas</h1>
        <p className="text-sm text-foreground/40 mt-0.5">Montos por tipo de evento</p>
      </div>
      <FineConfigForm eventTypes={eventTypes ?? []} />
    </div>
  )
}
