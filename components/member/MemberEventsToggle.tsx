'use client'

import { useState } from 'react'
import { List, CalendarDays } from 'lucide-react'
import { formatDateTime, formatCurrency, STATUS_CONFIG, EVENT_STATUS_CONFIG } from '@/lib/utils'
import type { AttendanceStatus, EventStatus } from '@/lib/supabase/types'
import EventsCalendarView from '@/components/director/EventsCalendarView'

type MemberEvent = {
  id: string
  title: string
  starts_at: string
  status: string
  notes: string | null
  event_types: { name: string } | null
  attendance: {
    status: AttendanceStatus
    fine_amount: number
    checked_in_at: string | null
  } | null
}

export default function MemberEventsToggle({
  upcoming,
  past,
  allEvents,
}: {
  upcoming: MemberEvent[]
  past: MemberEvent[]
  allEvents: MemberEvent[]
}) {
  const [view, setView] = useState<'list' | 'calendar'>('calendar')

  // EventsCalendarView espera objetos con starts_at y event_types
  const calEvents = allEvents.map(e => ({ ...e, event_types: e.event_types }))

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setView('list')}
          className={`flex-1 flex items-center justify-center gap-1.5 text-sm py-1.5 rounded-lg font-medium transition-colors ${
            view === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
          }`}
        >
          <List size={14} /> Lista
        </button>
        <button
          onClick={() => setView('calendar')}
          className={`flex-1 flex items-center justify-center gap-1.5 text-sm py-1.5 rounded-lg font-medium transition-colors ${
            view === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
          }`}
        >
          <CalendarDays size={14} /> Calendario
        </button>
      </div>

      {view === 'list' ? (
        <div className="space-y-6">
          {/* Próximos */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Próximos</h2>
            {upcoming.length > 0 ? (
              <div className="space-y-2">
                {upcoming.map(ev => <EventCard key={ev.id} ev={ev} />)}
              </div>
            ) : (
              <Empty text="No hay eventos próximos" />
            )}
          </section>

          {/* Pasados */}
          {past.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Pasados</h2>
              <div className="space-y-2">
                {past.map(ev => <EventCard key={ev.id} ev={ev} />)}
              </div>
            </section>
          )}
        </div>
      ) : (
        <EventsCalendarView events={calEvents} />
      )}
    </div>
  )
}

function EventCard({ ev }: { ev: MemberEvent }) {
  const eventCfg = EVENT_STATUS_CONFIG[ev.status as EventStatus]
  const att = ev.attendance
  const attCfg = att ? STATUS_CONFIG[att.status] : null

  return (
    <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-gray-900 text-sm">{ev.title}</p>
          <p className="text-xs text-gray-400">
            {ev.event_types?.name} · {formatDateTime(ev.starts_at)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {eventCfg && (
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${eventCfg.bg} ${eventCfg.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${eventCfg.dot}`} />
              {eventCfg.label}
            </span>
          )}
          {attCfg && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${attCfg.bg} ${attCfg.color}`}>
              {attCfg.label}
            </span>
          )}
          {att?.fine_amount && att.fine_amount > 0 ? (
            <p className="text-xs text-red-500">{formatCurrency(att.fine_amount)}</p>
          ) : null}
        </div>
      </div>
      {ev.notes && (
        <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
          📝 {ev.notes}
        </p>
      )}
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="bg-white rounded-xl p-6 text-center text-gray-400 border border-dashed border-gray-200">
      {text}
    </div>
  )
}
