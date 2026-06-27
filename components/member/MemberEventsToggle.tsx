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

  const calEvents = allEvents.map(e => ({ ...e, event_types: e.event_types }))

  return (
    <div className="space-y-4">
      {/* Segmented control con pill deslizante */}
      <div className="relative flex bg-foreground/6 rounded-xl p-1">
        {/* Pill animado */}
        <div
          className="absolute top-1 bottom-1 w-[calc(50%-2px)] rounded-lg bg-white shadow-sm transition-transform duration-200 [transition-timing-function:cubic-bezier(0.25,1,0.5,1)]"
          style={{ transform: view === 'list' ? 'translateX(0)' : 'translateX(calc(100% + 4px))' }}
          aria-hidden="true"
        />
        <button
          onClick={() => setView('list')}
          className={`relative flex-1 flex items-center justify-center gap-1.5 text-sm py-1.5 rounded-lg font-medium transition-colors duration-150 ${
            view === 'list' ? 'text-foreground' : 'text-foreground/40 hover:text-foreground/60'
          }`}
        >
          <List size={14} /> Lista
        </button>
        <button
          onClick={() => setView('calendar')}
          className={`relative flex-1 flex items-center justify-center gap-1.5 text-sm py-1.5 rounded-lg font-medium transition-colors duration-150 ${
            view === 'calendar' ? 'text-foreground' : 'text-foreground/40 hover:text-foreground/60'
          }`}
        >
          <CalendarDays size={14} /> Calendario
        </button>
      </div>

      {/* Contenido con fade al cambiar tab */}
      <div key={view} className="animate-tab-in">
        {view === 'list' ? (
          <div className="space-y-6">
            {upcoming.length > 0 ? (
              <section className="space-y-2">
                {upcoming.map(ev => <EventCard key={ev.id} ev={ev} />)}
              </section>
            ) : (
              <Empty text="Sin eventos próximos" />
            )}

            {past.length > 0 && (
              <section className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-foreground/30">Historial</span>
                  <div className="flex-1 h-px bg-foreground/8" />
                </div>
                {past.map(ev => <EventCard key={ev.id} ev={ev} />)}
              </section>
            )}
          </div>
        ) : (
          <EventsCalendarView events={calEvents} />
        )}
      </div>
    </div>
  )
}

function EventCard({ ev }: { ev: MemberEvent }) {
  const eventCfg = EVENT_STATUS_CONFIG[ev.status as EventStatus]
  const att = ev.attendance
  const attCfg = att ? STATUS_CONFIG[att.status] : null

  return (
    <div className="bg-white rounded-xl border border-foreground/8 shadow-e1 overflow-hidden">
      {eventCfg && (
        <div className={`px-3 py-1.5 flex items-center gap-1.5 ${eventCfg.bg}`}>
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${eventCfg.dot}`} />
          <span className={`text-xs font-medium ${eventCfg.color}`}>{eventCfg.label}</span>
          {att?.fine_amount && att.fine_amount > 0 ? (
            <span className="ml-auto text-xs font-semibold text-red-600">{formatCurrency(att.fine_amount)}</span>
          ) : null}
        </div>
      )}

      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium text-foreground text-sm leading-snug">{ev.title}</p>
            <p className="text-xs text-foreground/40 mt-0.5">
              {ev.event_types?.name} · {formatDateTime(ev.starts_at)}
            </p>
          </div>
          {attCfg && (
            <span className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${attCfg.bg} ${attCfg.color}`}>
              {attCfg.label}
            </span>
          )}
        </div>
        {ev.notes && (
          <p className="text-xs text-foreground/50 bg-foreground/4 rounded-lg px-3 py-2">
            {ev.notes}
          </p>
        )}
      </div>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-xl p-8 text-center border-2 border-dashed border-foreground/8">
      <p className="text-sm text-foreground/30">{text}</p>
    </div>
  )
}
