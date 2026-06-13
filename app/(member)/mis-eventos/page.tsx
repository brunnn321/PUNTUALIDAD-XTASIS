import { createClient } from '@/lib/supabase/server'
import { formatDate, formatDateTime, formatCurrency, STATUS_CONFIG } from '@/lib/utils'
import type { AttendanceStatus } from '@/lib/supabase/types'

export default async function MisEventosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: attendances } = await supabase
    .from('attendances')
    .select('*, events(*, event_types(name))')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const present = attendances?.filter(a => a.status === 'present').length ?? 0
  const late = attendances?.filter(a => a.status === 'late').length ?? 0
  const absent = attendances?.filter(a => a.status === 'absent').length ?? 0
  const total = attendances?.length ?? 0
  const pct = total > 0 ? Math.round((present / total) * 100) : 0

  return (
    <div className="p-4 space-y-5 max-w-lg mx-auto">
      <div className="pt-6">
        <h1 className="text-2xl font-bold text-gray-900">Mis eventos</h1>
      </div>

      {/* Resumen */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-600">Asistencia total</p>
          <p className="text-2xl font-bold text-violet-600">{pct}%</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div><p className="font-bold text-green-600">{present}</p><p className="text-xs text-gray-400">Presentes</p></div>
          <div><p className="font-bold text-amber-600">{late}</p><p className="text-xs text-gray-400">Tardanzas</p></div>
          <div><p className="font-bold text-red-600">{absent}</p><p className="text-xs text-gray-400">Faltas</p></div>
        </div>
      </div>

      {/* Historial */}
      <section>
        <h2 className="font-semibold text-gray-900 mb-3">Historial</h2>
        {attendances && attendances.length > 0 ? (
          <div className="space-y-2">
            {attendances.map((att: any) => {
              const { label, color, bg } = STATUS_CONFIG[att.status as AttendanceStatus]
              const event = att.events
              return (
                <div key={att.id} className="bg-white rounded-xl p-3 flex items-center justify-between shadow-sm border border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{event?.title}</p>
                    <p className="text-xs text-gray-400">
                      {event?.event_types?.name} · {event?.starts_at ? formatDateTime(event.starts_at) : ''}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
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
          <div className="bg-white rounded-xl p-8 text-center text-gray-400 border border-dashed border-gray-200">
            No tienes eventos registrados aún
          </div>
        )}
      </section>
    </div>
  )
}
