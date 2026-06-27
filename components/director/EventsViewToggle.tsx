'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRight, List, CalendarDays, CheckSquare, Square, X, Trash2 } from 'lucide-react'
import EventsCalendarView from './EventsCalendarView'
import { deleteEventById } from '@/lib/actions/events'

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  scheduled: { label: 'Programado', color: 'bg-blue-100 text-blue-700' },
  open:      { label: 'Abierto',    color: 'bg-green-100 text-green-700' },
  closed:    { label: 'Cerrado',    color: 'bg-foreground/8 text-foreground/40' },
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('es-BO', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export default function EventsViewToggle({ events }: { events: any[] }) {
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [mode, setMode] = useState<'view' | 'select'>('view')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const upcoming = events.filter(e => e.status !== 'closed')
  const past = events.filter(e => e.status === 'closed')

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function exitSelect() {
    setMode('view')
    setSelected(new Set())
    setConfirmDelete(false)
  }

  function handleDeleteSelected() {
    startTransition(async () => {
      for (const id of selected) {
        await deleteEventById(id)
      }
      exitSelect()
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {/* Toggle Lista / Calendario + Seleccionar */}
      <div className="flex gap-2 items-center">
        <div className="relative flex bg-foreground/6 rounded-xl p-1 flex-1">
          {/* Pill deslizante */}
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

        {view === 'list' && (
          mode === 'view' ? (
            <button
              onClick={() => setMode('select')}
              className="flex items-center gap-1.5 text-sm text-brand-500 font-medium border border-brand-200 px-3 py-2 rounded-xl hover:bg-brand-50 transition-colors whitespace-nowrap"
            >
              <CheckSquare size={14} /> Seleccionar
            </button>
          ) : (
            <button
              onClick={exitSelect}
              className="flex items-center gap-1.5 text-sm text-foreground/50 font-medium border border-foreground/12 px-3 py-2 rounded-xl hover:bg-foreground/4 transition-colors"
            >
              <X size={14} /> Cancelar
            </button>
          )
        )}
      </div>

      <div key={view} className="animate-tab-in">
        {view === 'list' ? (
          <div className="space-y-6">
            <section className="space-y-3">
              {upcoming.length > 0 ? (
                upcoming.map((event: any) => (
                  <EventRow key={event.id} event={event} mode={mode} selected={selected.has(event.id)} onToggle={() => toggleSelect(event.id)} />
                ))
              ) : (
                <Empty text="No hay eventos próximos" />
              )}
            </section>

            {past.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-foreground/30">Historial</span>
                  <div className="flex-1 h-px bg-foreground/8" />
                </div>
                {past.map((event: any) => (
                  <EventRow key={event.id} event={event} mode={mode} selected={selected.has(event.id)} onToggle={() => toggleSelect(event.id)} />
                ))}
              </section>
            )}
          </div>
        ) : (
          <EventsCalendarView events={events} />
        )}
      </div>

      {/* Barra de acciones en modo selección */}
      {mode === 'select' && selected.size > 0 && (
        <div className="fixed bottom-20 left-0 right-0 px-4 z-40 animate-slide-up">
          <div className="max-w-lg mx-auto bg-foreground text-white rounded-2xl p-4 shadow-2xl space-y-3">
            <p className="text-sm font-medium text-center text-white/50">
              {selected.size} evento{selected.size !== 1 ? 's' : ''} seleccionado{selected.size !== 1 ? 's' : ''}
            </p>
            <div className="flex gap-2">
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
                >
                  <Trash2 size={15} /> Eliminar
                </button>
              ) : (
                <>
                  <button
                    onClick={handleDeleteSelected}
                    disabled={isPending}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {isPending ? '...' : 'Sí'}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
                  >
                    No
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function EventRow({
  event,
  mode,
  selected,
  onToggle,
}: {
  event: any
  mode: 'view' | 'select'
  selected: boolean
  onToggle: () => void
}) {
  const { label, color } = STATUS_MAP[event.status] ?? { label: event.status, color: '' }

  const inner = (
    <div className={`flex items-center gap-3 bg-white rounded-xl p-4 border transition-colors shadow-e1 ${
      selected ? 'border-brand-400 bg-brand-50' : 'border-foreground/8'
    }`}>
      {mode === 'select' && (
        <span className={`flex-shrink-0 ${selected ? 'text-brand-500' : 'text-foreground/20'}`}>
          {selected ? <CheckSquare size={20} /> : <Square size={20} />}
        </span>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground">{event.title}</p>
        <p className="text-sm text-foreground/45 mt-0.5">
          {event.event_types?.name} · {formatDateTime(event.starts_at)}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${color}`}>{label}</span>
        {mode === 'view' && <ChevronRight size={16} className="text-foreground/25" />}
      </div>
    </div>
  )

  if (mode === 'select') {
    return (
      <button type="button" onClick={onToggle} className="w-full text-left">
        {inner}
      </button>
    )
  }

  return <Link href={`/eventos/${event.id}`}>{inner}</Link>
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-xl p-6 text-center border-2 border-dashed border-foreground/8">
      <p className="text-sm text-foreground/35">{text}</p>
    </div>
  )
}
