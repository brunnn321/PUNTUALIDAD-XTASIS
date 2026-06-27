import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import type { AttendanceStatus, SectionName } from '@/lib/supabase/types'
import MemberEventsToggle from '@/components/member/MemberEventsToggle'
import FetchError from '@/components/FetchError'

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

  const { data: allEvents, error: eventsError } = await eventsQuery

  if (eventsError) return <FetchError context="No se pudieron cargar tus eventos" />

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
    <div className="max-w-lg mx-auto px-4 pt-8 pb-24 space-y-6">
      <h1 className="text-2xl font-bold text-foreground tracking-tight">Mis eventos</h1>

      {/* Resumen de asistencia — solo si hay historial */}
      {total > 0 && (
        <div className="bg-white rounded-2xl border border-foreground/6 p-4 space-y-3">
          <div className="flex items-baseline justify-between">
            <p className="text-sm text-foreground/50">Asistencia</p>
            <p className="text-3xl font-bold text-foreground tabular-nums">{pct}<span className="text-lg font-semibold text-foreground/40">%</span></p>
          </div>
          <div className="grid grid-cols-3 gap-px bg-foreground/6 rounded-xl overflow-hidden">
            <div className="bg-white px-3 py-2.5 text-center">
              <p className="text-base font-bold text-green-600 tabular-nums">{present}</p>
              <p className="text-xs text-foreground/40 mt-0.5">Presentes</p>
            </div>
            <div className="bg-white px-3 py-2.5 text-center">
              <p className="text-base font-bold text-amber-600 tabular-nums">{late}</p>
              <p className="text-xs text-foreground/40 mt-0.5">Tardanzas</p>
            </div>
            <div className="bg-white px-3 py-2.5 text-center">
              <p className="text-base font-bold text-red-600 tabular-nums">{absent}</p>
              <p className="text-xs text-foreground/40 mt-0.5">Faltas</p>
            </div>
          </div>
          {totalFines > 0 && (
            <p className="text-xs text-red-500 text-center">
              {formatCurrency(totalFines)} en multas acumuladas
            </p>
          )}
        </div>
      )}

      <MemberEventsToggle upcoming={upcoming} past={past} allEvents={merged} />
    </div>
  )
}
