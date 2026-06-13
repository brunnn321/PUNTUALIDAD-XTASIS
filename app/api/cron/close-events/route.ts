import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()
  const now = new Date().toISOString()
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

  // Auto-abrir eventos cuya ventana de check-in ya comenzó
  await supabase
    .from('events')
    .update({ status: 'open' })
    .eq('status', 'scheduled')
    .lte('checkin_opens_at', now)
    .gte('starts_at', oneHourAgo)

  // Auto-cerrar eventos expirados
  const { data: expired } = await supabase
    .from('events')
    .select('id, title')
    .neq('status', 'closed')
    .lt('starts_at', oneHourAgo)

  if (!expired || expired.length === 0) {
    return NextResponse.json({ opened: 0, closed: 0 })
  }

  for (const event of expired) {
    await supabase.rpc('close_event', { p_event_id: event.id })
  }

  return NextResponse.json({ closed: expired.length, events: expired.map(e => e.title) })
}
