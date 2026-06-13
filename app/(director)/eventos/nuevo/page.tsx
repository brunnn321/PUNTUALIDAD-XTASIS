import { createClient } from '@/lib/supabase/server'
import EventForm from '@/components/director/EventForm'

export default async function NuevoEventoPage() {
  const supabase = await createClient()
  const { data: eventTypes } = await supabase
    .from('event_types')
    .select('*')
    .order('name')

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="pt-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nuevo evento</h1>
      </div>
      <EventForm eventTypes={eventTypes ?? []} />
    </div>
  )
}
