import { createClient } from '@/lib/supabase/server'
import FineConfigForm from '@/components/director/FineConfigForm'
import FetchError from '@/components/FetchError'

export default async function ConfiguracionPage() {
  const supabase = await createClient()
  const { data: eventTypes, error } = await supabase
    .from('event_types')
    .select('*')
    .order('name')

  if (error) return <FetchError context="No se pudo cargar la configuración" />

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Configuración</h1>
        <p className="text-sm text-foreground/40 mt-0.5">Montos de multas por tipo de evento</p>
      </div>
      <FineConfigForm eventTypes={eventTypes ?? []} />
    </div>
  )
}
