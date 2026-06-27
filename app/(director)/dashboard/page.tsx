import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDateTime, formatTime, EVENT_STATUS_CONFIG } from '@/lib/utils'
import { Calendar, ChevronRight, AlertTriangle, Users } from 'lucide-react'
import Link from 'next/link'
import type { EventStatus } from '@/lib/supabase/types'
import FetchError from '@/components/FetchError'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [profileRes, nextEventRes, activeEventRes, finesRes, membersRes] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user!.id).single(),
    supabase
      .from('events')
      .select('id, title, starts_at, status, checkin_opens_at, event_types(name)')
      .neq('status', 'closed')
      .order('starts_at')
      .limit(3),
    supabase
      .from('events')
      .select('id, title, starts_at, status, event_types(name)')
      .eq('status', 'open')
      .order('starts_at')
      .limit(1)
      .maybeSingle(),
    supabase.from('attendances').select('fine_amount').gt('fine_amount', 0),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('active', true)
      .eq('role', 'member'),
  ])

  if (nextEventRes.error || membersRes.error) {
    return <FetchError context="No se pudo cargar el panel" />
  }

  const profile = profileRes.data
  const upcomingEvents = nextEventRes.data ?? []
  const activeEvent = activeEventRes.data
  const totalFines = (finesRes.data ?? []).reduce((s, a) => s + (a.fine_amount ?? 0), 0)
  const membersCount = membersRes.count ?? 0
  const firstName = profile?.full_name?.split(' ')[0] ?? 'Director'

  // Evento principal: el abierto ahora, o el primero próximo
  const heroEvent = activeEvent ?? upcomingEvents[0] ?? null
  const restEvents = activeEvent
    ? upcomingEvents.slice(0, 2)
    : upcomingEvents.slice(1, 3)

  const now = new Date()
  const isLive = heroEvent?.status === 'open'

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pt-8 pb-24 space-y-6">

        {/* Saludo */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-foreground/50 font-medium">
              {greeting(now)}
            </p>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {firstName}
            </h1>
          </div>
          {/* Pulso live si hay evento abierto */}
          {isLive && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full mt-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              En curso
            </span>
          )}
        </div>

        {/* Evento hero */}
        {heroEvent ? (
          <Link
            href={`/eventos/${heroEvent.id}`}
            className="block group"
          >
            <div className={`relative rounded-2xl overflow-hidden ${isLive ? 'bg-foreground' : 'bg-brand-500'}`}>
              {/* Textura sutil */}
              <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 60%)' }} />

              <div className="relative p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${isLive ? 'text-green-400' : 'text-white/60'}`}>
                      {isLive ? 'Abierto ahora' : 'Próximo evento'}
                    </p>
                    <h2 className="text-xl font-bold text-white leading-tight">
                      {heroEvent.title}
                    </h2>
                    <p className={`text-sm mt-0.5 ${isLive ? 'text-white/70' : 'text-white/60'}`}>
                      {(heroEvent as any).event_types?.name}
                    </p>
                  </div>
                  <ChevronRight
                    size={20}
                    className="text-white/40 group-hover:text-white/80 transition-colors mt-1 flex-shrink-0"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold text-white tabular-nums">
                    {formatTime(heroEvent.starts_at)}
                  </p>
                  <div className={`text-xs font-semibold px-3 py-1.5 rounded-xl ${
                    isLive
                      ? 'bg-green-500 text-white'
                      : 'bg-white/20 text-white'
                  }`}>
                    {isLive ? 'Ver asistencia →' : 'Ver detalle →'}
                  </div>
                </div>

                <p className={`text-xs ${isLive ? 'text-white/50' : 'text-white/40'}`}>
                  {formatDateTime(heroEvent.starts_at)}
                </p>
              </div>
            </div>
          </Link>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-foreground/10 p-8 text-center space-y-2">
            <Calendar size={28} className="mx-auto text-foreground/20" />
            <p className="text-sm font-medium text-foreground/40">Sin eventos próximos</p>
            <Link
              href="/eventos/nuevo"
              className="inline-block text-xs font-semibold text-brand-500 hover:text-brand-600 transition-colors"
            >
              Crear evento →
            </Link>
          </div>
        )}

        {/* Próximos eventos (los que siguen después del hero) */}
        {restEvents.length > 0 && (
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground/60">Próximos</h2>
              <Link href="/eventos" className="text-xs font-medium text-brand-500 hover:text-brand-600 transition-colors">
                Ver todos
              </Link>
            </div>
            {restEvents.map((ev: any) => {
              const cfg = EVENT_STATUS_CONFIG[ev.status as EventStatus]
              return (
                <Link
                  key={ev.id}
                  href={`/eventos/${ev.id}`}
                  className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-foreground/6 hover:border-brand-200 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{ev.title}</p>
                    <p className="text-xs text-foreground/40 mt-0.5">
                      {ev.event_types?.name} · {formatDateTime(ev.starts_at)}
                    </p>
                  </div>
                  <span className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </Link>
              )
            })}
          </section>
        )}

        {/* Banda de estado — solo si hay algo que requiere atención */}
        {(totalFines > 0 || membersCount === 0) && (
          <section className="space-y-2">
            {totalFines > 0 && (
              <Link
                href="/reportes/multas"
                className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3 group"
              >
                <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-red-700">
                    {formatCurrency(totalFines)} en multas pendientes
                  </p>
                  <p className="text-xs text-red-500">Toca para ver el reporte</p>
                </div>
                <ChevronRight size={16} className="text-red-300 group-hover:text-red-500 transition-colors" />
              </Link>
            )}
            {membersCount === 0 && (
              <Link
                href="/miembros/nuevo"
                className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3"
              >
                <Users size={16} className="text-amber-600 flex-shrink-0" />
                <p className="text-sm font-semibold text-amber-700">Sin miembros activos — agregar ahora</p>
              </Link>
            )}
          </section>
        )}

        {/* Datos contextuales — solo texto, sin cards */}
        <div className="flex items-center gap-4 px-1 text-xs text-foreground/40">
          <span>{membersCount} miembro{membersCount !== 1 ? 's' : ''} activo{membersCount !== 1 ? 's' : ''}</span>
          {totalFines === 0 && (
            <span className="text-green-600 font-medium">Sin multas pendientes</span>
          )}
        </div>

      </div>
    </div>
  )
}

function greeting(now: Date): string {
  const h = now.getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}
