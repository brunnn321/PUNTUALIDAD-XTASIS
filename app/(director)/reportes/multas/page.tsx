import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDateTime, SECTION_LABELS, STATUS_CONFIG } from '@/lib/utils'
import type { SectionName, AttendanceStatus } from '@/lib/supabase/types'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function MultasPage() {
  const supabase = await createClient()

  const { data: fines } = await supabase
    .from('attendances')
    .select('event_id, user_id, fine_amount, status, events(id, title, starts_at, event_types(name)), profiles(full_name, photo_url, section)')
    .gt('fine_amount', 0)
    .order('created_at', { ascending: false })

  // Agrupar por evento
  const byEventMap = new Map<string, {
    eventId: string
    title: string
    starts_at: string
    typeName: string
    entries: typeof fines
  }>()

  for (const f of fines ?? []) {
    const ev = (f as any).events
    const eventId = ev?.id ?? f.event_id
    if (!byEventMap.has(eventId)) {
      byEventMap.set(eventId, {
        eventId,
        title: ev?.title ?? '—',
        starts_at: ev?.starts_at ?? '',
        typeName: ev?.event_types?.name ?? '',
        entries: [],
      })
    }
    byEventMap.get(eventId)!.entries!.push(f as any)
  }

  // Ordenar por fecha descendente
  const byEvent = [...byEventMap.values()].sort(
    (a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime()
  )

  const grandTotal = (fines ?? []).reduce((sum: number, f: any) => sum + f.fine_amount, 0)

  return (
    <div className="p-4 space-y-5 max-w-lg mx-auto">
      <div className="pt-4">
        <Link href="/reportes" className="flex items-center gap-1 text-sm text-violet-600 mb-3">
          <ChevronLeft size={16} /> Reportes
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Multas por cobrar</h1>
      </div>

      {/* Total general */}
      <div className="bg-red-600 text-white rounded-2xl p-5 text-center">
        <p className="text-red-200 text-sm">Total pendiente del grupo</p>
        <p className="text-4xl font-bold mt-1">{formatCurrency(grandTotal)}</p>
        <p className="text-red-200 text-sm mt-1">{byEvent.length} evento{byEvent.length !== 1 ? 's' : ''} con multas</p>
      </div>

      {/* Lista por evento */}
      {byEvent.length > 0 ? (
        <div className="space-y-3">
          {byEvent.map(ev => {
            const eventTotal = ev.entries!.reduce((sum: number, f: any) => sum + f.fine_amount, 0)
            return (
              <details key={ev.eventId} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <summary className="flex items-center gap-3 p-3 cursor-pointer list-none">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{ev.title}</p>
                    <p className="text-xs text-gray-400">
                      {ev.typeName}{ev.starts_at ? ` · ${formatDateTime(ev.starts_at)}` : ''} · {ev.entries!.length} multa{ev.entries!.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <p className="font-bold text-red-600 flex-shrink-0">{formatCurrency(eventTotal)}</p>
                </summary>

                {/* Miembros con multa en ese evento */}
                <div className="border-t border-gray-100 divide-y divide-gray-50">
                  {ev.entries!.map((f: any, i: number) => {
                    const profile = f.profiles
                    const { label, color, bg } = STATUS_CONFIG[f.status as AttendanceStatus]
                    return (
                      <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                        {profile?.photo_url ? (
                          <img src={profile.photo_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-xs flex-shrink-0">
                            {profile?.full_name?.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 font-medium truncate">{profile?.full_name ?? '—'}</p>
                          <p className="text-xs text-gray-400">
                            {profile?.section ? SECTION_LABELS[profile.section as SectionName] : ''}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${bg} ${color}`}>{label}</span>
                          <p className="text-sm font-semibold text-red-600 mt-0.5">{formatCurrency(f.fine_amount)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </details>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl p-8 text-center text-gray-400 border border-dashed border-gray-200">
          No hay multas pendientes
        </div>
      )}
    </div>
  )
}
