import { createClient } from '@/lib/supabase/server'
import EventForm from '@/components/director/EventForm'
import type { SectionName } from '@/lib/supabase/types'

export default async function NuevoEventoPage({
  searchParams,
}: {
  searchParams: Promise<{ sections?: string }>
}) {
  const supabase = await createClient()
  const { data: eventTypes } = await supabase
    .from('event_types')
    .select('*')
    .order('name')

  const { sections } = await searchParams
  const initialSections = sections
    ? (sections.split(',').filter(Boolean) as SectionName[])
    : []

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="pt-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nuevo evento</h1>
      </div>
      <EventForm eventTypes={eventTypes ?? []} initialSections={initialSections} />
    </div>
  )
}
