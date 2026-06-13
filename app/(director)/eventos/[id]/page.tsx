export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { formatDateTime, formatCurrency, SECTION_LABELS, STATUS_CONFIG } from '@/lib/utils'
import EventControls from '@/components/director/EventControls'
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

  const { data: attendances } = await supabase
    .from('attendances')
    .select('*, profiles(id, full_name, photo_url, section, instrument)')
    .eq('event_id', id)
    .order('created_at')

  // Estadísticas
  const total = attendances?.length ?? 0
  const present = attendances?.filter(a => a.status === 'present').length ?? 0
  const late = attendances?.filter(a => a.status === 'late').length ?? 0
  const absent = attendances?.filter(a => a.status === 'absent').length ?? 0
  const totalFines = attendances?.reduce((sum, a) => sum + a.fine_amount, 0) ?? 0

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
        {event.target_sections && (
          <p className="text-xs text-gray-400 mt-0.5">
            Secciones: {event.target_sections.map((s: SectionName) => SECTION_LABELS[s]).join(', ')}
          </p>
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
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Presentes', value: present, color: 'text-green-600' },
          { label: 'Tardanzas', value: late,    color: 'text-amber-600' },
          { label: 'Faltas',    value: absent,  color: 'text-red-600' },
          { label: 'Total',     value: total,   color: 'text-gray-700' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {totalFines > 0 && (
        <div className="bg-red-50 rounded-xl p-3 text-center">
          <p className="text-sm text-red-600">Multas generadas: <strong>{formatCurrency(totalFines)}</strong></p>
        </div>
      )}

      {/* Lista de asistencias */}
      <section>
        <h2 className="font-semibold text-gray-900 mb-2">Asistencias</h2>
        {attendances && attendances.length > 0 ? (
          <div className="space-y-2">
            {attendances.map((att: any) => {
              const { label, color, bg } = STATUS_CONFIG[att.status as AttendanceStatus]
              return (
                <div key={att.id} className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm border border-gray-100">
                  {att.profiles?.photo_url ? (
                    <img src={att.profiles.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-sm">
                      {att.profiles?.full_name?.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{att.profiles?.full_name}</p>
                    <p className="text-xs text-gray-400">
                      {att.profiles?.section ? SECTION_LABELS[att.profiles.section as SectionName] : ''}
                      {att.profiles?.instrument ? ` · ${att.profiles.instrument}` : ''}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${bg} ${color}`}>{label}</span>
                    {att.fine_amount > 0 && (
                      <p className="text-xs text-red-500 mt-1">{formatCurrency(att.fine_amount)}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-6 text-center text-gray-400 border border-dashed border-gray-200">
            No hay asistencias registradas aún
          </div>
        )}
      </section>
    </div>
  )
}
