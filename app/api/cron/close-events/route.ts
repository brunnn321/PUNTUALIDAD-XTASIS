import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { sendPushToUsers } from '@/lib/webpush'
import { logSupabaseError } from '@/lib/supabase/query-helpers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestId = crypto.randomUUID()
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()
  const admin = createAdminClient()
  const now = new Date().toISOString()
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const errors: string[] = []

  // Auto-abrir eventos cuya ventana de check-in ya comenzó y notificar
  const { data: opened, error: openedError } = await supabase
    .from('events')
    .update({ status: 'open' })
    .eq('status', 'scheduled')
    .eq('notified', false)
    .lte('checkin_opens_at', now)
    .gte('starts_at', oneHourAgo)
    .select('id, title, starts_at, target_sections')

  if (logSupabaseError('cron/close-events: open scheduled events', openedError, { requestId })) {
    errors.push('open_scheduled_events')
  }

  if (opened?.length) {
    for (const event of opened) {
      let query = admin
        .from('profiles')
        .select('id')
        .eq('active', true)
        .eq('role', 'member')

      if (event.target_sections?.length) {
        query = query.in('section', event.target_sections)
      }

      const { data: members, error: membersError } = await query

      if (logSupabaseError('cron/close-events: fetch members for notify', membersError, { eventId: event.id, requestId })) {
        errors.push(`fetch_members:${event.id}`)
      }

      if (members?.length) {
        const time = new Date(event.starts_at).toLocaleTimeString('es-BO', {
          hour: '2-digit',
          minute: '2-digit',
        })

        await sendPushToUsers(admin, members.map((m: { id: string }) => m.id), {
          title: '🎵 Check-in abierto — Xtasis',
          body: `${event.title} comienza a las ${time}. ¡Marca tu asistencia!`,
          url: '/home',
        })
      }

      const { error: notifiedError } = await admin.from('events').update({ notified: true }).eq('id', event.id)
      if (logSupabaseError('cron/close-events: mark notified', notifiedError, { eventId: event.id, requestId })) {
        errors.push(`mark_notified:${event.id}`)
      }
    }
  }

  // Auto-cerrar eventos expirados
  const { data: expired, error: expiredError } = await supabase
    .from('events')
    .select('id, title')
    .neq('status', 'closed')
    .lt('starts_at', oneHourAgo)

  if (logSupabaseError('cron/close-events: fetch expired events', expiredError, { requestId })) {
    errors.push('fetch_expired_events')
  }

  if (!expired || expired.length === 0) {
    return NextResponse.json({ opened: opened?.length ?? 0, closed: 0, errors })
  }

  for (const event of expired) {
    const { error: closeError } = await supabase.rpc('close_event', { p_event_id: event.id })
    if (logSupabaseError('cron/close-events: close_event rpc', closeError, { eventId: event.id, requestId })) {
      errors.push(`close_event:${event.id}`)
    }
  }

  return NextResponse.json({
    opened: opened?.length ?? 0,
    closed: expired.length,
    events: expired.map((e) => e.title),
    errors,
  })
}
