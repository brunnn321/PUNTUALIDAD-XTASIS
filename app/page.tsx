export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import KioskCheckIn from '@/components/kiosk/KioskCheckIn'
import type { SectionName } from '@/lib/supabase/types'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'director') redirect('/dashboard')
    // Sesión de miembro residual (ya no se usa): se ignora y se muestra el kiosco igual.
  }

  const admin = createAdminClient()
  const now = new Date()

  const { data: candidateEvents } = await admin
    .from('events')
    .select('*')
    .neq('status', 'closed')
    .order('starts_at', { ascending: true })

  const openEvent = (candidateEvents ?? []).find(e => {
    const opensAt = new Date(e.checkin_opens_at)
    const closesAt = new Date(new Date(e.starts_at).getTime() + 60 * 60 * 1000)
    return now >= opensAt && now <= closesAt
  })

  if (!openEvent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center space-y-3 bg-gray-50">
        <h1 className="text-xl font-bold text-gray-900">No hay check-in activo</h1>
        <p className="text-sm text-gray-500">Vuelve cuando el director abra un evento.</p>
      </div>
    )
  }

  const { data: members } = await admin
    .from('profiles')
    .select('id, full_name, photo_url, section')
    .eq('role', 'member')
    .eq('active', true)
    .order('full_name')

  const { data: existingAttendances } = await admin
    .from('attendances')
    .select('user_id')
    .eq('event_id', openEvent.id)

  const checkedInIds = new Set((existingAttendances ?? []).map(a => a.user_id))

  const eligible = (members ?? []).filter(m => {
    if (checkedInIds.has(m.id)) return false
    if (!openEvent.target_sections || openEvent.target_sections.length === 0) return true
    return openEvent.target_sections.includes(m.section as SectionName)
  })

  return (
    <KioskCheckIn
      eventId={openEvent.id}
      eventTitle={openEvent.title}
      members={eligible}
    />
  )
}
