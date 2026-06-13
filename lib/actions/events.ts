'use server'

import { createClient } from '@/lib/supabase/server'

// Cierra automáticamente eventos que llevan más de 1 hora desde su inicio
export async function autoCloseExpiredEvents() {
  const supabase = await createClient()

  // Buscar eventos que deberían estar cerrados:
  // starts_at + 60 min < ahora Y status != 'closed'
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

  const { data: expiredEvents } = await supabase
    .from('events')
    .select('id')
    .neq('status', 'closed')
    .lt('starts_at', oneHourAgo)

  if (!expiredEvents || expiredEvents.length === 0) return

  // Cerrar cada evento vencido
  for (const event of expiredEvents) {
    await supabase.rpc('close_event', { p_event_id: event.id })
  }
}
