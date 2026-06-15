'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, List, CalendarDays } from 'lucide-react'
import EventsCalendarView from './EventsCalendarView'

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  scheduled: { label: 'Programado', color: 'bg-blue-100 text-blue-700' },
  open:      { label: 'Abierto',    color: 'bg-green-100 text-green-700' },
  closed:    { label: 'Cerrado',    color: 'bg-gray-100 text-gray-500' },
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('es-BO', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export default function EventsViewToggle({ events }: { events: any[] }) {
  const [view, setView] = useState<'list' | 'calendar'>('list')

  const upcoming = events.filter(e => e.status !== 'closed')
  const past = events.filter(e => e.status === 'closed')

  return (
    <div className="space-y-4">
      {/* Toggle Lista / Calendario */}
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
                {upcoming.map((event: any) => (
                  <EventRow key={event.id} event={event} />
                ))}
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
                {past.map((event: any) => (
                  <EventRow key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <EventsCalendarView events={events} />
      )}
    </div>
  )
}

function EventRow({ event }: { event: any }) {
  const { label, color } = STATUS_MAP[event.status] ?? { label: event.status, color: '' }
  return (
    <Link
      href={`/eventos/${event.id}`}
      className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-gray-100"
    >
      <div>
        <p className="font-medium text-gray-900">{event.title}</p>
        <p className="text-sm text-gray-500">
          {event.event_types?.name} · {formatDateTime(event.starts_at)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${color}`}>{label}</span>
        <ChevronRight size={16} className="text-gray-400" />
      </div>
    </Link>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="bg-white rounded-xl p-6 text-center text-gray-400 border border-dashed border-gray-200">
      {text}
    </div>
  )
}
