import { createClient } from '@/lib/supabase/server'
import { autoCloseExpiredEvents } from '@/lib/actions/events'
import EventsViewToggle from '@/components/director/EventsViewToggle'
import Link from 'next/link'
import { Plus, Receipt } from 'lucide-react'
import FetchError from '@/components/FetchError'

export default async function EventosPage() {
  await autoCloseExpiredEvents()

  const supabase = await createClient()

  const { data: events, error } = await supabase
    .from('events')
    .select('*, event_types(name)')
    .order('starts_at', { ascending: false })
    .limit(50)

  if (error) return <FetchError context="No se pudieron cargar los eventos" />

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-24 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Eventos</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/eventos/multas"
            className="flex items-center gap-1.5 text-sm text-brand-500 font-medium border border-brand-200 px-3 py-2 rounded-xl hover:bg-brand-50 transition-colors"
          >
            <Receipt size={15} /> Multas
          </Link>
          <Link
            href="/eventos/nuevo"
            className="flex items-center gap-1.5 bg-brand-500 text-white px-3 py-2 rounded-xl text-sm font-medium"
          >
            <Plus size={18} /> Nuevo
          </Link>
        </div>
      </div>

      <EventsViewToggle events={events ?? []} />
    </div>
  )
}
