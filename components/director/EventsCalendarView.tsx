'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// Color por nombre de tipo de evento
const TYPE_COLORS: Record<string, { dot: string; bg: string; text: string }> = {
  'Ensayo':        { dot: 'bg-blue-500',   bg: 'bg-blue-50',   text: 'text-blue-700' },
  'Presentación':  { dot: 'bg-violet-500', bg: 'bg-violet-50', text: 'text-violet-700' },
  'Viaje':         { dot: 'bg-orange-500', bg: 'bg-orange-50', text: 'text-orange-700' },
  'Medios':        { dot: 'bg-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-700' },
  'Seccional':     { dot: 'bg-green-500',  bg: 'bg-green-50',  text: 'text-green-700' },
}
const DEFAULT_COLOR = { dot: 'bg-gray-500', bg: 'bg-gray-50', text: 'text-gray-700' }

function getColor(typeName?: string) {
  return typeName ? (TYPE_COLORS[typeName] ?? DEFAULT_COLOR) : DEFAULT_COLOR
}

const DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const MONTHS = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
]

export default function EventsCalendarView({ events }: { events: any[] }) {
  const [current, setCurrent] = useState(() => {
    const d = new Date()
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
    return d
  })
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const year = current.getFullYear()
  const month = current.getMonth()

  // Primer día de la semana (lunes=0)
  const firstDayOfMonth = new Date(year, month, 1)
  const startOffset = (firstDayOfMonth.getDay() + 6) % 7 // lunes = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Mapa día → eventos del mes actual
  const eventsByDay = new Map<number, any[]>()
  for (const ev of events) {
    const d = new Date(ev.starts_at)
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate()
      if (!eventsByDay.has(day)) eventsByDay.set(day, [])
      eventsByDay.get(day)!.push(ev)
    }
  }

  const selectedEvents = selectedDay !== null ? (eventsByDay.get(selectedDay) ?? []) : []

  function prevMonth() {
    setCurrent(new Date(year, month - 1, 1))
    setSelectedDay(null)
  }
  function nextMonth() {
    setCurrent(new Date(year, month + 1, 1))
    setSelectedDay(null)
  }

  // Celdas: blancos + días
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const today = new Date()
  const isToday = (day: number) =>
    today.getDate() === day && today.getMonth() === month && today.getFullYear() === year

  return (
    <div className="space-y-4">
      {/* Cabecera del mes */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <h2 className="font-semibold text-gray-900">
          {MONTHS[month]} {year}
        </h2>
        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronRight size={20} className="text-gray-600" />
        </button>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 text-center">
        {DAYS.map(d => (
          <div key={d} className="text-xs font-semibold text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Grid de días */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />
          const dayEvents = eventsByDay.get(day) ?? []
          const selected = selectedDay === day
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(selected ? null : day)}
              className={`relative flex flex-col items-center py-1.5 rounded-xl transition-colors ${
                selected ? 'bg-violet-600' : 'hover:bg-gray-50'
              }`}
            >
              <span className={`text-sm font-medium ${
                selected ? 'text-white' :
                isToday(day) ? 'text-violet-600 font-bold' :
                'text-gray-700'
              }`}>
                {day}
              </span>
              {/* Puntos de color por tipo de evento */}
              {dayEvents.length > 0 && (
                <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                  {dayEvents.slice(0, 3).map((ev, j) => {
                    const c = getColor(ev.event_types?.name)
                    return (
                      <span
                        key={j}
                        className={`w-1.5 h-1.5 rounded-full ${selected ? 'bg-white/70' : c.dot}`}
                      />
                    )
                  })}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Panel de eventos del día seleccionado */}
      {selectedDay !== null && (
        <div className="space-y-2 pt-1">
          <p className="text-sm font-semibold text-gray-700">
            {selectedDay} de {MONTHS[month]}
          </p>
          {selectedEvents.length > 0 ? (
            selectedEvents.map((ev: any) => {
              const c = getColor(ev.event_types?.name)
              const time = new Date(ev.starts_at).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })
              return (
                <Link
                  key={ev.id}
                  href={`/eventos/${ev.id}`}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border ${c.bg} border-transparent`}
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${c.text}`}>{ev.title}</p>
                    <p className="text-xs text-gray-500">{ev.event_types?.name} · {time}</p>
                  </div>
                  <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
                </Link>
              )
            })
          ) : (
            <p className="text-sm text-gray-400 text-center py-2">Sin eventos</p>
          )}
        </div>
      )}

      {/* Leyenda de colores */}
      <div className="flex flex-wrap gap-3 pt-1">
        {Object.entries(TYPE_COLORS).map(([name, c]) => (
          <div key={name} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${c.dot}`} />
            <span className="text-xs text-gray-500">{name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
