export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import EventForm from '@/components/director/EventForm'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default async function EditarEventoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: event }, { data: eventTypes }] = await Promise.all([
    supabase.from('events').select('*').eq('id', id).single(),
    supabase.from('event_types').select('*').order('name'),
  ])

  if (!event || event.status === 'closed') notFound()

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="pt-4 mb-6">
        <Link href={`/eventos/${id}`} className="flex items-center gap-1 text-sm text-violet-600 mb-3">
          <ChevronLeft size={16} /> Volver al evento
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Editar evento</h1>
      </div>
      <EventForm eventTypes={eventTypes ?? []} event={event} />
    </div>
  )
}
