import { createClient } from '@/lib/supabase/server'
import { formatDateTime } from '@/lib/utils'
import Link from 'next/link'
import { Plus, ChevronRight } from 'lucide-react'

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  scheduled: { label: 'Programado', color: 'bg-blue-100 text-blue-700' },
  open:      { label: 'Abierto',    color: 'bg-green-100 text-green-700' },
  closed:    { label: 'Cerrado',    color: 'bg-gray-100 text-gray-500' },
}

export default async function EventosPage() {
  const supabase = await createClient()

  const { data: events } = await supabase
    .from('events')
    .select('*, event_types(name)')
    .order('starts_at', { ascending: false })
    .limit(50)

  const upcoming = events?.filter(e => e.status !== 'closed') ?? []
  const past = events?.filter(e => e.status === 'closed') ?? []

  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto">
      <div className="pt-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Eventos</h1>
        <Link
          href="/eventos/nuevo"
          className="flex items-center gap-1.5 bg-violet-600 text-white px-3 py-2 rounded-xl text-sm font-medium"
        >
          <Plus size={18} /> Nuevo
        </Link>
      </div>

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
