import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { sendPushToUsers } from '@/lib/webpush'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()
  const admin = createAdminClient()
  const now = new Date().toISOString()
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

  // Auto-abrir eventos cuya ventana de check-in ya comenzó y notificar
  const { data: opened } = await supabase
    .from('events')
    .update({ status: 'open' })
    .eq('status', 'scheduled')
    .eq('notified', false)
    .lte('checkin_opens_at', now)
    .gte('starts_at', oneHourAgo)
    .select('id, title, starts_at, target_sections')

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

      const { data: members } = await query

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

      await admin.from('events').update({ notified: true }).eq('id', event.id)
    }
  }

  // Auto-cerrar eventos expirados
  const { data: expired } = await supabase
    .from('events')
    .select('id, title')
    .neq('status', 'closed')
    .lt('starts_at', oneHourAgo)

  if (!expired || expired.length === 0) {
    return NextResponse.json({ opened: opened?.length ?? 0, closed: 0 })
  }

  for (const event of expired) {
    await supabase.rpc('close_event', { p_event_id: event.id })
  }

  return NextResponse.json({
    opened: opened?.length ?? 0,
    closed: expired.length,
    events: expired.map((e) => e.title),
  })
}
