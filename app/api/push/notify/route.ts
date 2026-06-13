import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { sendPushToUsers } from '@/lib/webpush'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'director') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { eventId } = await request.json()

  const admin = createAdminClient()

  const { data: event } = await admin
    .from('events')
    .select('title, starts_at, target_sections')
    .eq('id', eventId)
    .single()

  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let query = admin
    .from('profiles')
    .select('id')
    .eq('active', true)
    .eq('role', 'member')

  if (event.target_sections?.length) {
    query = query.in('section', event.target_sections)
  }

  const { data: members } = await query

  if (!members?.length) return NextResponse.json({ ok: true, sent: 0 })

  const time = new Date(event.starts_at).toLocaleTimeString('es-BO', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const sent = await sendPushToUsers(
    admin,
    members.map((m) => m.id),
    {
      title: '🎵 Check-in abierto — Xtasis',
      body: `${event.title} comienza a las ${time}. ¡Marca tu asistencia!`,
      url: '/home',
    }
  )

  return NextResponse.json({ ok: true, sent })
}
