import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { sendPushToUsers } from '@/lib/webpush'
import { logSupabaseError } from '@/lib/supabase/query-helpers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? undefined
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (logSupabaseError('push/notify: getUser', userError, { requestId }) || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (logSupabaseError('push/notify: fetch profile', profileError, { userId: user.id, requestId })) {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }

  if (profile?.role !== 'director') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { eventId } = await request.json()
  const admin = createAdminClient()

  const { data: event, error: eventError } = await admin
    .from('events')
    .select('title, starts_at, target_sections')
    .eq('id', eventId)
    .single()

  if (logSupabaseError('push/notify: fetch event', eventError, { eventId, requestId })) {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let query = admin
    .from('profiles')
    .select('id')
    .eq('active', true)
    .eq('role', 'member')

  if (event.target_sections?.length) {
    query = query.in('section', event.target_sections)
  }

  const { data: members, error: membersError } = await query

  if (logSupabaseError('push/notify: fetch members', membersError, { eventId, requestId })) {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
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
