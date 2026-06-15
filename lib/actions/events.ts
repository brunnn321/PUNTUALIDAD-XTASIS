'use server'

import { createClient } from '@/lib/supabase/server'

export async function deleteEventById(id: string) {
  const supabase = await createClient()
  await supabase.from('events').delete().eq('id', id)
}

export async function autoCloseExpiredEvents() {
  const supabase = await createClient()
  const now = new Date().toISOString()
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

  // Abrir eventos cuya ventana de check-in ya comenzó y siguen en 'scheduled'
  await supabase
    .from('events')
    .update({ status: 'open' })
    .eq('status', 'scheduled')
    .lte('checkin_opens_at', now)
    .gte('starts_at', oneHourAgo)

  // Cerrar eventos que llevan más de 1 hora desde su inicio
  const { data: expiredEvents } = await supabase
    .from('events')
    .select('id')
    .neq('status', 'closed')
    .lt('starts_at', oneHourAgo)

  if (!expiredEvents || expiredEvents.length === 0) return

  for (const event of expiredEvents) {
    await supabase.rpc('close_event', { p_event_id: event.id })
  }
}
