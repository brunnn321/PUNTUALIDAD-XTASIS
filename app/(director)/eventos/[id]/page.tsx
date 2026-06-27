export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { formatDateTime, formatCurrency, SECTION_LABELS, STATUS_CONFIG } from '@/lib/utils'
import EventControls from '@/components/director/EventControls'
import AttendancePhoto from '@/components/director/AttendancePhoto'
import type { AttendanceStatus, SectionName } from '@/lib/supabase/types'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import FetchError from '@/components/FetchError'

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('*, event_types(*)')
    .eq('id', id)
    .single()

  if (eventError) return <FetchError context="No se pudo cargar el evento" />
  if (!event) notFound()

  // Para eventos cerrados mostramos activos + inactivos (inactivos al final)
  // Para eventos abiertos/programados solo activos
  const isClosed = event.status === 'closed'

  let membersQuery = supabase
    .from('profiles')
    .select('id, full_name, photo_url, section, instrument, active')
    .eq('role', 'member')
    .order('full_name')

  if (!isClosed) {
    membersQuery = membersQuery.eq('active', true)
  }

  if (event.target_sections && event.target_sections.length > 0) {
    membersQuery = membersQuery.in('section', event.target_sections)
  }

  const [{ data: members, error: membersError }, { data: attendances }] = await Promise.all([
    membersQuery,
    supabase
      .from('attendances')
      .select('user_id, status, fine_amount, checked_in_at, photo_url')
      .eq('event_id', id),
  ])

  if (membersError) return <FetchError context="No se pudo cargar la lista de miembros" />

  // Mapa rápido user_id → asistencia
  const attMap = new Map(attendances?.map(a => [a.user_id, a]) ?? [])

  // Combinar miembros con su estado; en eventos cerrados, inactivos al final
  const allRows = (members ?? []).map(m => ({
    ...m,
    attendance: attMap.get(m.id) ?? null,
  }))
  const rows = isClosed
    ? [...allRows.filter(r => r.active !== false), ...allRows.filter(r => r.active === false)]
    : allRows

  const present  = rows.filter(r => r.attendance?.status === 'present').length
  const late     = rows.filter(r => r.attendance?.status === 'late').length
  const absent   = rows.filter(r => r.attendance?.status === 'absent').length
  const pending  = rows.filter(r => !r.attendance).length
  const totalFines = attendances?.reduce((sum, a) => sum + (a.fine_amount ?? 0), 0) ?? 0

  const eventType = (event as any).event_types

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24 space-y-5">
      {/* Header */}
      <div>
        <Link href="/eventos" className="flex items-center gap-1 text-sm text-brand-500 mb-3">
          <ChevronLeft size={16} /> Eventos
        </Link>
        <h1 className="text-xl font-bold text-foreground">{event.title}</h1>
        <p className="text-sm text-foreground/50 mt-0.5">{eventType?.name} · {formatDateTime(event.starts_at)}</p>
        {event.target_sections && event.target_sections.length > 0 ? (
          <p className="text-xs text-foreground/35 mt-0.5">
            Secciones: {event.target_sections.map((s: SectionName) => SECTION_LABELS[s]).join(', ')}
          </p>
        ) : (
          <p className="text-xs text-foreground/35 mt-0.5">Todas las secciones</p>
        )}
      </div>

      {/* Controles del director */}
      <EventControls
        eventId={event.id}
        status={event.status}
        checkinOpensAt={event.checkin_opens_at}
        startsAt={event.starts_at}
      />

      {/* Stats */}
      <div className="grid grid-cols-5 gap-1.5">
        {[
          { label: 'Presentes',  value: present,     color: 'text-green-600' },
          { label: 'Tardanzas',  value: late,         color: 'text-amber-600' },
          { label: 'Faltas',     value: absent,       color: 'text-red-600'   },
          { label: 'Pendientes', value: pending,      color: 'text-foreground/40' },
          { label: 'Total',      value: rows.length,  color: 'text-foreground' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-2.5 text-center border border-foreground/6">
            <p className={`text-lg font-bold tabular-nums ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-foreground/35 leading-tight mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {totalFines > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
          <p className="text-sm text-red-600">Multas generadas: <strong>{formatCurrency(totalFines)}</strong></p>
        </div>
      )}

      {/* Lista de miembros */}
      <section className="space-y-2">
        <p className="text-sm font-medium text-foreground/50">Miembros · {rows.length}</p>
        {rows.length > 0 ? (
          <div className="space-y-2">
            {rows.map(row => {
              const att = row.attendance
              const statusCfg = att ? STATUS_CONFIG[att.status as AttendanceStatus] : null

              return (
                <div key={row.id} className="bg-white rounded-xl p-3 flex items-center gap-3 border border-foreground/6">
                  {row.photo_url ? (
                    <img src={row.photo_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-500 font-bold text-sm flex-shrink-0">
                      {row.full_name?.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-medium text-foreground text-sm truncate">{row.full_name}</p>
                      {row.active === false && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-foreground/8 text-foreground/40 flex-shrink-0">Inactivo</span>
                      )}
                    </div>
                    <p className="text-xs text-foreground/40 mt-0.5">
                      {row.section ? SECTION_LABELS[row.section as SectionName] : ''}
                      {row.instrument ? ` · ${row.instrument}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {att?.photo_url && att.status !== 'absent' && (
                      <AttendancePhoto url={att.photo_url} name={row.full_name ?? ''} />
                    )}
                    <div className="text-right">
                      {statusCfg ? (
                        <>
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusCfg.bg} ${statusCfg.color}`}>
                            {statusCfg.label}
                          </span>
                          {att!.checked_in_at && att!.status !== 'absent' && (
                            <p className="text-xs text-foreground/35 mt-1 tabular-nums">
                              {new Date(att!.checked_in_at).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                          {att!.fine_amount > 0 && (
                            <p className="text-xs text-red-500 mt-0.5">{formatCurrency(att!.fine_amount)}</p>
                          )}
                        </>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full bg-foreground/6 text-foreground/40">
                          Pendiente
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-xl p-6 text-center border-2 border-dashed border-foreground/8">
            <p className="text-sm text-foreground/35">No hay miembros en las secciones seleccionadas</p>
          </div>
        )}
      </section>
    </div>
  )
}
