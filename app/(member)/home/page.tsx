import { createClient } from '@/lib/supabase/server'
import { formatDateTime, formatCurrency, SECTION_LABELS, EVENT_STATUS_CONFIG } from '@/lib/utils'
import { autoCloseExpiredEvents } from '@/lib/actions/events'
import CheckInButton from '@/components/member/CheckInButton'
import AutoRefreshOnOpen from '@/components/member/AutoRefreshOnOpen'
import AttendancePhoto from '@/components/director/AttendancePhoto'
import { getLeastFinesRanking } from '@/lib/actions/rankings'
import type { SectionName, EventWithType } from '@/lib/supabase/types'
import { ChevronRight, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import FetchError from '@/components/FetchError'

const MEDALS = ['🥇', '🥈', '🥉']

export default async function HomePage() {
  await autoCloseExpiredEvents()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  if (profileError) {
    return <FetchError context="No se pudo cargar tu perfil" />
  }

  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString()

  // Próximos eventos (no cerrados, incluyendo ventana de check-in activa)
  const { data: upcomingEvents, error: eventsError } = await supabase
    .from('events')
    .select('*, event_types(*)')
    .gte('starts_at', oneHourAgo)
    .neq('status', 'closed')
    .order('starts_at', { ascending: true })

  // Eventos cerrados recientes (últimos 10)
  const { data: closedEvents } = await supabase
    .from('events')
    .select('*, event_types(*)')
    .eq('status', 'closed')
    .order('starts_at', { ascending: false })
    .limit(10)

  const allEvents = [...(upcomingEvents ?? []), ...(closedEvents ?? [])]

  // Mi asistencia registrada en esos eventos
  const eventIds = upcomingEvents?.map(e => e.id) ?? []
  const { data: myAttendances } = await supabase
    .from('attendances')
    .select('*')
    .eq('user_id', user!.id)
    .in('event_id', eventIds)

  const { data: fineData } = await supabase
    .from('attendances')
    .select('fine_amount')
    .eq('user_id', user!.id)
    .gt('fine_amount', 0)

  const totalFines = fineData?.reduce((sum, a) => sum + a.fine_amount, 0) ?? 0
  const top3 = await getLeastFinesRanking(3)

  function appliesToMe(event: EventWithType): boolean {
    if (!event.target_sections || event.target_sections.length === 0) return true
    return event.target_sections.includes(profile?.section as SectionName)
  }

  const nowForAutoOpen = new Date()

  const upcomingOpensAt = (upcomingEvents ?? [])
    .filter(event => {
      if (!appliesToMe(event)) return false
      if (myAttendances?.find(a => a.event_id === event.id)) return false
      return new Date(event.checkin_opens_at) > nowForAutoOpen
    })
    .map(event => event.checkin_opens_at)

  const pendingOpenEvents = (upcomingEvents ?? []).filter(event => {
    if (!appliesToMe(event)) return false
    if (myAttendances?.find(a => a.event_id === event.id)) return false
    const opensAt = new Date(event.checkin_opens_at)
    const closesAt = new Date(new Date(event.starts_at).getTime() + 60 * 60 * 1000)
    return nowForAutoOpen >= opensAt && nowForAutoOpen <= closesAt
  })
  const autoOpenEventId = pendingOpenEvents.length === 1 ? pendingOpenEvents[0].id : null

  const firstName = profile?.full_name?.split(' ')[0] ?? ''
  const sectionLabel = profile?.section ? SECTION_LABELS[profile.section as SectionName] : null
  const sectionLine = [sectionLabel, profile?.instrument].filter(Boolean).join(' · ')

  // Separar eventos: los que aplican vs. los que no
  const myEvents = (upcomingEvents ?? []).filter(appliesToMe)
  const otherEvents = (upcomingEvents ?? []).filter(e => !appliesToMe(e))
  const heroEvent = myEvents[0] ?? null
  const restEvents = myEvents.slice(1)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pt-8 pb-24 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-foreground/50">Hola,</p>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">{firstName}</h1>
            {sectionLine && (
              <p className="text-xs text-foreground/40 mt-0.5">{sectionLine}</p>
            )}
          </div>
          {profile?.photo_url && (
            <img
              src={profile.photo_url}
              alt={firstName}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-brand-200"
            />
          )}
        </div>

        {/* Alerta de multas — solo si hay */}
        {totalFines > 0 && (
          <Link
            href="/mis-multas"
            className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3 group"
          >
            <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-700">
                {formatCurrency(totalFines)} en multas
              </p>
              <p className="text-xs text-red-400">Ver detalle</p>
            </div>
            <ChevronRight size={16} className="text-red-300 group-hover:text-red-500 transition-colors" />
          </Link>
        )}

        {/* Evento hero — check-in como protagonista */}
        {heroEvent ? (() => {
          const myAttendance = myAttendances?.find(a => a.event_id === heroEvent.id)
          const opensAt = new Date(heroEvent.checkin_opens_at)
          const closesAt = new Date(new Date(heroEvent.starts_at).getTime() + 60 * 60 * 1000)
          const isOpen = nowForAutoOpen >= opensAt && nowForAutoOpen <= closesAt
          const cfg = EVENT_STATUS_CONFIG[heroEvent.status as keyof typeof EVENT_STATUS_CONFIG]

          return (
            <section className="space-y-3">
              <div className="bg-white rounded-2xl border border-foreground/6 overflow-hidden">
                {/* Franja de estado */}
                <div className={`px-4 py-2 flex items-center gap-2 ${cfg.bg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                  {isOpen && (
                    <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-green-700">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                      </span>
                      Check-in abierto
                    </span>
                  )}
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <h2 className="text-lg font-bold text-foreground leading-tight">{heroEvent.title}</h2>
                    <p className="text-sm text-foreground/50 mt-0.5">
                      {heroEvent.event_types?.name} · {formatDateTime(heroEvent.starts_at)}
                    </p>
                  </div>

                  {heroEvent.notes && (
                    <p className="text-xs text-foreground/50 bg-foreground/4 rounded-lg px-3 py-2">
                      {heroEvent.notes}
                    </p>
                  )}

                  {myAttendance ? (
                    <div className="flex items-center justify-between pt-1">
                      <p className="text-sm font-medium text-green-700 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs">✓</span>
                        Asistencia registrada
                      </p>
                      {myAttendance.photo_url && (
                        <AttendancePhoto url={myAttendance.photo_url} name={heroEvent.title} />
                      )}
                    </div>
                  ) : (
                    <CheckInButton
                      eventId={heroEvent.id}
                      eventTitle={heroEvent.title}
                      isOpen={isOpen}
                      opensAt={heroEvent.checkin_opens_at}
                      autoOpen={autoOpenEventId === heroEvent.id}
                    />
                  )}
                </div>
              </div>

              {/* Eventos adicionales del día */}
              {restEvents.length > 0 && (
                <div className="space-y-2">
                  {restEvents.map((event: any) => {
                    const att = myAttendances?.find(a => a.event_id === event.id)
                    const evOpensAt = new Date(event.checkin_opens_at)
                    const evClosesAt = new Date(new Date(event.starts_at).getTime() + 60 * 60 * 1000)
                    const evIsOpen = nowForAutoOpen >= evOpensAt && nowForAutoOpen <= evClosesAt
                    return (
                      <div key={event.id} className="bg-white rounded-xl border border-foreground/6 p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-foreground text-sm truncate">{event.title}</p>
                            <p className="text-xs text-foreground/40">{formatDateTime(event.starts_at)}</p>
                          </div>
                        </div>
                        {att ? (
                          <p className="text-xs text-green-600 font-medium">✓ Registrado</p>
                        ) : (
                          <CheckInButton
                            eventId={event.id}
                            eventTitle={event.title}
                            isOpen={evIsOpen}
                            opensAt={event.checkin_opens_at}
                            autoOpen={autoOpenEventId === event.id}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          )
        })() : (
          <div className="bg-white rounded-2xl border-2 border-dashed border-foreground/10 p-10 text-center space-y-1">
            <p className="text-sm font-medium text-foreground/40">Sin eventos próximos</p>
            <p className="text-xs text-foreground/25">Te avisaremos cuando haya uno</p>
          </div>
        )}

        {/* Eventos de otras secciones */}
        {otherEvents.length > 0 && (
          <section className="space-y-2">
            {otherEvents.map((event: any) => (
              <div key={event.id} className="bg-white rounded-xl border border-foreground/6 px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground/60 truncate">{event.title}</p>
                  <p className="text-xs text-foreground/35">{formatDateTime(event.starts_at)}</p>
                </div>
                <span className="flex-shrink-0 text-xs text-foreground/35 font-medium">No aplica para tu sección</span>
              </div>
            ))}
          </section>
        )}

        {/* Ranking — al fondo, colapsable en espíritu */}
        {top3.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground/50">Top · Menos multas</h2>
            <div className="space-y-1.5">
              {top3.map((m, i) => (
                <div key={m.id} className="flex items-center gap-3 bg-white rounded-xl px-3 py-2.5 border border-foreground/6">
                  <span className="text-lg w-7 text-center leading-none">{MEDALS[i]}</span>
                  {m.photo_url ? (
                    <img src={m.photo_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-500 font-bold text-xs flex-shrink-0">
                      {m.full_name?.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{m.full_name}</p>
                    {m.section && (
                      <p className="text-xs text-foreground/40">{SECTION_LABELS[m.section as SectionName]}</p>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-green-600 flex-shrink-0">✓</span>
                </div>
              ))}
            </div>
          </section>
        )}

      {/* Eventos anteriores (cerrados) */}
      {closedEvents && closedEvents.length > 0 && (
        <section>
          <h2 className="font-semibold text-gray-900 mb-3">Eventos anteriores</h2>
          <div className="space-y-2">
            {closedEvents.filter(appliesToMe).map((event: any) => {
              const myAttendance = myAttendances?.find(a => a.event_id === event.id)
              const statusMap: Record<string, { label: string; color: string }> = {
                present: { label: 'Presente',  color: 'text-green-600' },
                late:    { label: 'Tardanza',  color: 'text-amber-600' },
                absent:  { label: 'Falta',     color: 'text-red-600'   },
              }
              const att = myAttendance ? statusMap[myAttendance.status] : null
              return (
                <div key={event.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 text-sm truncate">{event.title}</p>
                    <p className="text-xs text-gray-400">{formatDateTime(event.starts_at)}</p>
                  </div>
                  {att ? (
                    <span className={`text-xs font-semibold flex-shrink-0 ${att.color}`}>{att.label}</span>
                  ) : (
                    <span className="text-xs text-gray-400 flex-shrink-0">Sin registro</span>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}


      </div>
      <AutoRefreshOnOpen opensAtList={upcomingOpensAt} />
    </div>
  )
}
