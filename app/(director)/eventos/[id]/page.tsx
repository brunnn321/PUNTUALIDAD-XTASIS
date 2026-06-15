export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { formatDateTime, formatCurrency, SECTION_LABELS, STATUS_CONFIG } from '@/lib/utils'
import EventControls from '@/components/director/EventControls'
import AttendancePhoto from '@/components/director/AttendancePhoto'
import type { AttendanceStatus, SectionName } from '@/lib/supabase/types'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('*, event_types(*)')
    .eq('id', id)
    .single()

  if (!event) notFound()

  // Todos los miembros aplicables al evento según secciones
  let membersQuery = supabase
    .from('profiles')
    .select('id, full_name, photo_url, section, instrument')
    .eq('role', 'member')
    .eq('active', true)
    .order('full_name')

  if (event.target_sections && event.target_sections.length > 0) {
    membersQuery = membersQuery.in('section', event.target_sections)
  }

  const [{ data: members }, { data: attendances }] = await Promise.all([
    membersQuery,
    supabase
      .from('attendances')
      .select('user_id, status, fine_amount, checked_in_at, photo_url')
      .eq('event_id', id),
  ])

  // Mapa rápido user_id → asistencia
  const attMap = new Map(attendances?.map(a => [a.user_id, a]) ?? [])

  // Combinar miembros con su estado
  const rows = (members ?? []).map(m => ({
    ...m,
    attendance: attMap.get(m.id) ?? null,
  }))

  const present  = rows.filter(r => r.attendance?.status === 'present').length
  const late     = rows.filter(r => r.attendance?.status === 'late').length
  const absent   = rows.filter(r => r.attendance?.status === 'absent').length
  const pending  = rows.filter(r => !r.attendance).length
  const totalFines = attendances?.reduce((sum, a) => sum + (a.fine_amount ?? 0), 0) ?? 0

  const eventType = (event as any).event_types

  return (
    <div className="p-4 space-y-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="pt-4">
        <Link href="/eventos" className="flex items-center gap-1 text-sm text-violet-600 mb-3">
          <ChevronLeft size={16} /> Eventos
        </Link>
        <h1 className="text-xl font-bold text-gray-900">{event.title}</h1>
        <p className="text-sm text-gray-500">{eventType?.name} · {formatDateTime(event.starts_at)}</p>
        {event.target_sections && event.target_sections.length > 0 ? (
          <p className="text-xs text-gray-400 mt-0.5">
            Secciones: {event.target_sections.map((s: SectionName) => SECTION_LABELS[s]).join(', ')}
          </p>
        ) : (
          <p className="text-xs text-gray-400 mt-0.5">Todas las secciones</p>
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
          { label: 'Presentes',  value: present, color: 'text-green-600' },
          { label: 'Tardanzas',  value: late,    color: 'text-amber-600' },
          { label: 'Faltas',     value: absent,  color: 'text-red-600'   },
          { label: 'Pendientes', value: pending, color: 'text-gray-400'  },
          { label: 'Total',      value: rows.length, color: 'text-gray-700' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-2.5 text-center shadow-sm border border-gray-100">
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-400 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {totalFines > 0 && (
        <div className="bg-red-50 rounded-xl p-3 text-center">
          <p className="text-sm text-red-600">Multas generadas: <strong>{formatCurrency(totalFines)}</strong></p>
        </div>
      )}

      {/* Lista de miembros */}
      <section>
        <h2 className="font-semibold text-gray-900 mb-2">Miembros ({rows.length})</h2>
        {rows.length > 0 ? (
          <div className="space-y-2">
            {rows.map(row => {
              const att = row.attendance
              const statusCfg = att ? STATUS_CONFIG[att.status as AttendanceStatus] : null

              return (
                <div key={row.id} className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm border border-gray-100">
                  {/* Avatar de perfil */}
                  {row.photo_url ? (
                    <img src={row.photo_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-sm flex-shrink-0">
                      {row.full_name?.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{row.full_name}</p>
                    <p className="text-xs text-gray-400">
                      {row.section ? SECTION_LABELS[row.section as SectionName] : ''}
                      {row.instrument ? ` · ${row.instrument}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Foto de asistencia en miniatura */}
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
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(att!.checked_in_at).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                          {att!.fine_amount > 0 && (
                            <p className="text-xs text-red-500 mt-0.5">{formatCurrency(att!.fine_amount)}</p>
                          )}
                        </>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-400">
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
          <div className="bg-white rounded-xl p-6 text-center text-gray-400 border border-dashed border-gray-200">
            No hay miembros en las secciones seleccionadas
          </div>
        )}
      </section>
    </div>
  )
}
