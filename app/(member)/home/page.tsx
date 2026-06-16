import { createClient } from '@/lib/supabase/server'
import { formatDateTime, formatCurrency, SECTION_LABELS, EVENT_STATUS_CONFIG } from '@/lib/utils'
import { autoCloseExpiredEvents } from '@/lib/actions/events'
import CheckInButton from '@/components/member/CheckInButton'
import AttendancePhoto from '@/components/director/AttendancePhoto'
import { getLeastFinesRanking } from '@/lib/actions/rankings'
import type { SectionName, EventWithType } from '@/lib/supabase/types'

const MEDALS = ['🥇', '🥈', '🥉']

export default async function HomePage() {
  // Cerrar automáticamente eventos vencidos antes de cargar la página
  await autoCloseExpiredEvents()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString()

  // Próximos eventos: incluir los que empezaron hace menos de 1 hora (ventana de check-in activa)
  const { data: upcomingEvents } = await supabase
    .from('events')
    .select('*, event_types(*)')
    .gte('starts_at', oneHourAgo)
    .neq('status', 'closed')
    .order('starts_at', { ascending: false })

  // Mi asistencia registrada en esos eventos
  const eventIds = upcomingEvents?.map(e => e.id) ?? []
  const { data: myAttendances } = await supabase
    .from('attendances')
    .select('*')
    .eq('user_id', user!.id)
    .in('event_id', eventIds)

  // Mis multas totales
  const { data: fineData } = await supabase
    .from('attendances')
    .select('fine_amount')
    .eq('user_id', user!.id)
    .gt('fine_amount', 0)

  const totalFines = fineData?.reduce((sum, a) => sum + a.fine_amount, 0) ?? 0

  // Top 3 con menos multas del grupo
  const top3 = await getLeastFinesRanking(3)

  // Determinar si el evento aplica a este miembro
  function appliesToMe(event: EventWithType): boolean {
    if (!event.target_sections || event.target_sections.length === 0) return true
    return event.target_sections.includes(profile?.section as SectionName)
  }

  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="pt-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Hola,</p>
          <h1 className="text-2xl font-bold text-gray-900">{profile?.full_name?.split(' ')[0]}</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {profile?.section ? SECTION_LABELS[profile.section as SectionName] : 'Sin sección'}
            {profile?.instrument ? ` · ${profile.instrument}` : ''}
          </p>
        </div>
        {profile?.photo_url && (
          <img src={profile.photo_url} alt="" className="w-12 h-12 rounded-full object-cover" />
        )}
      </div>

      {/* Multas pendientes */}
      {totalFines > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-red-500 font-medium">Multas acumuladas</p>
            <p className="text-xl font-bold text-red-700">{formatCurrency(totalFines)}</p>
          </div>
          <a href="/mis-multas" className="text-sm text-red-600 underline">Ver detalle</a>
        </div>
      )}

      {/* Top 3 con menos multas */}
      {top3.length > 0 && (
        <section>
          <h2 className="font-semibold text-gray-900 mb-3">Top 3 · Menos multas</h2>
          <div className="space-y-2">
            {top3.map((m, i) => (
              <div key={m.id} className="flex items-center gap-3 rounded-xl p-3 shadow-sm border bg-white border-gray-100">
                <span className="text-2xl w-8 text-center">{MEDALS[i]}</span>
                {m.photo_url ? (
                  <img src={m.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-sm">
                    {m.full_name?.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{m.full_name}</p>
                  <p className="text-xs text-gray-500">
                    {m.section ? SECTION_LABELS[m.section as SectionName] : 'Sin sección'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Próximos eventos */}
      <section>
        <h2 className="font-semibold text-gray-900 mb-3">Próximos eventos</h2>
        <div className="space-y-3">
          {upcomingEvents && upcomingEvents.length > 0 ? upcomingEvents.map((event: any) => {
            const applies = appliesToMe(event)
            const myAttendance = myAttendances?.find(a => a.event_id === event.id)
            const nowDate = new Date()
            const opensAt = new Date(event.checkin_opens_at)
            const closesAt = new Date(new Date(event.starts_at).getTime() + 60 * 60 * 1000)
            // Check-in abierto automáticamente: desde la ventana hasta 1 hora después del inicio
            const isOpen = nowDate >= opensAt && nowDate <= closesAt

            return (
              <div key={event.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">{event.title}</p>
                    <p className="text-sm text-gray-500">
                      {event.event_types?.name} · {formatDateTime(event.starts_at)}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <EventStatusPill status={event.status} />
                  </div>
                </div>
                {event.notes && (
                  <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                    📝 {event.notes}
                  </p>
                )}

                {!applies && (
                  <p className="text-xs bg-gray-100 text-gray-500 rounded-lg px-3 py-2 text-center">
                    No aplica para tu sección
                  </p>
                )}

                {applies && !myAttendance && (
                  <CheckInButton
                    eventId={event.id}
                    isOpen={isOpen}
                    opensAt={event.checkin_opens_at}
                  />
                )}

                {applies && myAttendance && (
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-xs text-gray-400">Asistencia ya registrada</p>
                    {myAttendance.photo_url && (
                      <AttendancePhoto url={myAttendance.photo_url} name={event.title} />
                    )}
                  </div>
                )}
              </div>
            )
          }) : (
            <div className="bg-white rounded-xl p-8 text-center text-gray-400 border border-dashed border-gray-200">
              No hay eventos próximos
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function EventStatusPill({ status }: { status: string }) {
  const cfg = EVENT_STATUS_CONFIG[status as keyof typeof EVENT_STATUS_CONFIG]
  if (!cfg) return null
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}
