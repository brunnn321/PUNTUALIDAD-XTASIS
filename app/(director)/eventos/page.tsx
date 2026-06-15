import { createClient } from '@/lib/supabase/server'
import { autoCloseExpiredEvents } from '@/lib/actions/events'
import EventsViewToggle from '@/components/director/EventsViewToggle'
import Link from 'next/link'
import { Plus, Receipt } from 'lucide-react'

export default async function EventosPage() {
  await autoCloseExpiredEvents()

  const supabase = await createClient()

  const { data: events } = await supabase
    .from('events')
    .select('*, event_types(name)')
    .order('starts_at', { ascending: false })
    .limit(50)

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <div className="pt-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Eventos</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/eventos/multas"
            className="flex items-center gap-1.5 text-sm text-violet-600 font-medium border border-violet-200 px-3 py-2 rounded-xl hover:bg-violet-50 transition-colors"
          >
            <Receipt size={15} /> Multas
          </Link>
          <Link
            href="/eventos/nuevo"
            className="flex items-center gap-1.5 bg-violet-600 text-white px-3 py-2 rounded-xl text-sm font-medium"
          >
            <Plus size={18} /> Nuevo
          </Link>
        </div>
      </div>

      <EventsViewToggle events={events ?? []} />
    </div>
  )
}
