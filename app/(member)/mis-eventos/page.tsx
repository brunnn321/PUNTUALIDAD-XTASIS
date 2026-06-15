import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import type { AttendanceStatus, SectionName } from '@/lib/supabase/types'
import MemberEventsToggle from '@/components/member/MemberEventsToggle'

export default async function MisEventosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('section')
    .eq('id', user!.id)
    .single()

  // Todos los eventos aplicables a la sección del miembro
  let eventsQuery = supabase
    .from('events')
    .select('id, title, starts_at, status, notes, target_sections, event_types(name)')
    .order('starts_at', { ascending: false })
    .limit(100)

  const { data: allEvents } = await eventsQuery

  // Filtrar los que aplican al miembro según sección
  const section = profile?.section as SectionName | null
  const applicable = (allEvents ?? []).filter((ev: any) => {
    if (!ev.target_sections || ev.target_sections.length === 0) return true
    return section && ev.target_sections.includes(section)
  })

  // Mis asistencias en esos eventos
  const eventIds = applicable.map((e: any) => e.id)
  const { data: attendances } = eventIds.length > 0
    ? await supabase
        .from('attendances')
        .select('event_id, status, fine_amount, checked_in_at')
        .eq('user_id', user!.id)
        .in('event_id', eventIds)
    : { data: [] }

  const attMap = new Map(attendances?.map(a => [a.event_id, a]) ?? [])

  // Combinar evento + asistencia
  const merged = applicable.map((ev: any) => ({
    ...ev,
    attendance: attMap.get(ev.id) ?? null,
  }))

  const upcoming = merged.filter((e: any) => e.status !== 'closed')
  const past = merged.filter((e: any) => e.status === 'closed')

  // Stats globales (solo eventos cerrados con asistencia registrada)
  const closedAtts = past.filter((e: any) => e.attendance)
  const present = closedAtts.filter((e: any) => e.attendance.status === 'present').length
  const late    = closedAtts.filter((e: any) => e.attendance.status === 'late').length
  const absent  = closedAtts.filter((e: any) => e.attendance.status === 'absent').length
  const total   = closedAtts.length
  const pct     = total > 0 ? Math.round(((present + late) / total) * 100) : 0
  const totalFines = closedAtts.reduce((sum: number, e: any) => sum + (e.attendance.fine_amount ?? 0), 0)

  return (
    <div className="p-4 space-y-5 max-w-lg mx-auto">
      <div className="pt-6">
        <h1 className="text-2xl font-bold text-gray-900">Mis eventos</h1>
      </div>

      {/* Resumen */}
      {total > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-600">Asistencia total</p>
            <p className="text-2xl font-bold text-violet-600">{pct}%</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div><p className="font-bold text-green-600">{present}</p><p className="text-xs text-gray-400">Presentes</p></div>
            <div><p className="font-bold text-amber-600">{late}</p><p className="text-xs text-gray-400">Tardanzas</p></div>
            <div><p className="font-bold text-red-600">{absent}</p><p className="text-xs text-gray-400">Faltas</p></div>
          </div>
          {totalFines > 0 && (
            <p className="text-xs text-red-500 text-center mt-2">
              Multas acumuladas: <strong>{formatCurrency(totalFines)}</strong>
            </p>
          )}
        </div>
      )}

      <MemberEventsToggle upcoming={upcoming} past={past} allEvents={merged} />
    </div>
  )
}
