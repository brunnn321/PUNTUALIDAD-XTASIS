import { createClient } from '@/lib/supabase/server'
import FineConfigForm from '@/components/director/FineConfigForm'

export default async function ConfiguracionPage() {
  const supabase = await createClient()
  const { data: eventTypes } = await supabase
    .from('event_types')
    .select('*')
    .order('name')

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="pt-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-sm text-gray-500 mt-1">Montos de multas por tipo de evento</p>
      </div>
      <FineConfigForm eventTypes={eventTypes ?? []} />
    </div>
  )
}
