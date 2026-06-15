import { createClient } from '@/lib/supabase/server'
import { formatDateTime, formatCurrency, SECTION_LABELS, STATUS_CONFIG } from '@/lib/utils'
import type { AttendanceStatus, SectionName } from '@/lib/supabase/types'
import { settleFine } from '@/lib/actions/fines'
import DateRangeFilter from '@/components/director/DateRangeFilter'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default async function MemberReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ periodo?: string; desde?: string; hasta?: string }>
}) {
  const { id } = await params
  const { periodo = 'all', desde, hasta } = await searchParams
  const supabase = await createClient()

  const { data: member } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (!member) notFound()

  const { data: allAttendances } = await supabase
    .from('attendances')
    .select('*, events(title, starts_at, event_types(name))')
    .eq('user_id', id)
    .order('created_at', { ascending: false })

  // Aplicar filtro de rango o período
  const hasRange = !!(desde && hasta)
  const rangeStart = hasRange ? `${desde}T00:00:00` : null
  const rangeEnd   = hasRange ? `${hasta}T23:59:59` : null

  function getPeriodStart(p: string): string | null {
    const now = new Date()
    if (p === 'week') {
      const d = new Date(now); d.setDate(d.getDate() - 7); return d.toISOString()
    }
    if (p === 'month') {
      const d = new Date(now); d.setDate(1); d.setHours(0, 0, 0, 0); return d.toISOString()
    }
    return null
  }
  const periodStart = hasRange ? null : getPeriodStart(periodo)

  const attendances = (allAttendances ?? []).filter((a: any) => {
    const eventDate = a.events?.starts_at
    if (!eventDate) return false
    if (hasRange) return eventDate >= rangeStart! && eventDate <= rangeEnd!
    if (periodStart) return eventDate >= periodStart
    return true
  })

  const total      = attendances.length
  const present    = attendances.filter((a: any) => a.status === 'present').length
  const late       = attendances.filter((a: any) => a.status === 'late').length
  const absent     = attendances.filter((a: any) => a.status === 'absent').length
  const totalFines = attendances.reduce((sum: number, a: any) => sum + a.fine_amount, 0)
  const pct        = total > 0 ? Math.round(((present + late) / total) * 100) : 0

  return (
    <div className="p-4 space-y-5 max-w-lg mx-auto">
      <div className="pt-4">
        <Link href="/reportes" className="flex items-center gap-1 text-sm text-violet-600 mb-3">
          <ChevronLeft size={16} /> Reportes
        </Link>
        <div className="flex items-center gap-3">
          {member.photo_url ? (
            <img src={member.photo_url} alt="" className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold">
              {member.full_name?.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-900">{member.full_name}</h1>
            <p className="text-sm text-gray-400">
              {member.section ? SECTION_LABELS[member.section as SectionName] : 'Sin sección'}
              {member.instrument ? ` · ${member.instrument}` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Filtro de fecha */}
      <DateRangeFilter
        periodo={periodo}
        desde={desde}
        hasta={hasta}
        basePath={`/reportes/miembro/${id}`}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-violet-50 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-violet-700">{pct}%</p>
          <p className="text-xs text-gray-500">Asistencia</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 text-center">
          <p className="text-xl font-bold text-red-700">{formatCurrency(totalFines)}</p>
          <p className="text-xs text-gray-500">Multas</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Presentes" value={present} color="text-green-600" />
        <Stat label="Tardanzas" value={late}    color="text-amber-600" />
        <Stat label="Faltas"    value={absent}  color="text-red-600" />
      </div>

      {/* Historial */}
      <section>
        <h2 className="font-semibold text-gray-900 mb-3">
          Historial {total > 0 ? `(${total})` : ''}
        </h2>
        {attendances.length > 0 ? (
          <div className="space-y-2">
            {attendances.map((att: any) => {
              const { label, color, bg } = STATUS_CONFIG[att.status as AttendanceStatus]
              return (
                <div key={att.id} className="bg-white rounded-xl p-3 flex items-center justify-between shadow-sm border border-gray-100">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{att.events?.title}</p>
                    <p className="text-xs text-gray-400">
                      {att.events?.event_types?.name} · {att.events?.starts_at ? formatDateTime(att.events.starts_at) : ''}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${bg} ${color}`}>{label}</span>
                    {att.fine_amount > 0 && (
                      <div className="mt-1 flex items-center justify-end gap-2">
                        <p className="text-xs text-red-500">{formatCurrency(att.fine_amount)}</p>
                        <form action={settleFine}>
                          <input type="hidden" name="attendanceId" value={att.id} />
                          <button
                            type="submit"
                            className="text-xs text-green-600 font-medium border border-green-300 rounded-full px-2 py-0.5 hover:bg-green-50 transition-colors"
                          >
                            Saldar
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-6 text-center text-gray-400 border border-dashed border-gray-200">
            Sin eventos registrados en este período
          </div>
        )}
      </section>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  )
}
