'use server'

import { createClient } from '@/lib/supabase/server'
import { logSupabaseError } from '@/lib/supabase/query-helpers'
import { redirect } from 'next/navigation'

export async function updateEvent(
  id: string,
  data: {
    title: string
    eventTypeId: string
    startsAt: string
    checkinWindowMin: number
    targetSections: string[]
    notes: string
  }
) {
  const supabase = await createClient()

  const startsAtMs = new Date(data.startsAt).getTime()
  const opensAtMs  = startsAtMs - data.checkinWindowMin * 60 * 1000
  const closesAtMs = startsAtMs + 60 * 60 * 1000
  const nowMs = Date.now()

  // Fix bug: recalcular status según la nueva hora para evitar que quede
  // 'open' con una ventana de check-in que ya no corresponde al nuevo horario.
  const newStatus = nowMs >= opensAtMs && nowMs < closesAtMs ? 'open' : 'scheduled'

  const { error } = await supabase
    .from('events')
    .update({
      title: data.title,
      event_type_id: data.eventTypeId,
      starts_at: new Date(data.startsAt).toISOString(),
      checkin_window_min: data.checkinWindowMin,
      target_sections: data.targetSections.length > 0 ? data.targetSections : null,
      notes: data.notes || null,
      status: newStatus,
    })
    .eq('id', id)
    .neq('status', 'closed')

  if (logSupabaseError('events: updateEvent', error, { eventId: id })) {
    return { error: error!.message }
  }

  redirect(`/eventos/${id}`)
}

export async function deleteEventById(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('events').delete().eq('id', id)
  logSupabaseError('events: deleteEventById', error, { eventId: id })
}

export async function autoCloseExpiredEvents() {
  const supabase = await createClient()
  const now = new Date().toISOString()
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

  // Abrir eventos cuya ventana de check-in ya comenzó y siguen en 'scheduled'
  const { error: openError } = await supabase
    .from('events')
    .update({ status: 'open' })
    .eq('status', 'scheduled')
    .lte('checkin_opens_at', now)
    .gte('starts_at', oneHourAgo)

  logSupabaseError('events: autoCloseExpiredEvents open scheduled', openError)

  // Cerrar eventos que llevan más de 1 hora desde su inicio
  const { data: expiredEvents, error: expiredError } = await supabase
    .from('events')
    .select('id')
    .neq('status', 'closed')
    .lt('starts_at', oneHourAgo)

  if (logSupabaseError('events: autoCloseExpiredEvents fetch expired', expiredError)) return
  if (!expiredEvents || expiredEvents.length === 0) return

  for (const event of expiredEvents) {
    const { error: closeError } = await supabase.rpc('close_event', { p_event_id: event.id })
    logSupabaseError('events: autoCloseExpiredEvents close_event rpc', closeError, { eventId: event.id })
  }
}
