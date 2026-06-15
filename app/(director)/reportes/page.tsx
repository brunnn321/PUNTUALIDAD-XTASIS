import { createClient } from '@/lib/supabase/server'
import { formatCurrency, SECTION_LABELS } from '@/lib/utils'
import type { SectionName } from '@/lib/supabase/types'
import Link from 'next/link'
import DateRangeFilter from '@/components/director/DateRangeFilter'

const MEDALS = ['🥇', '🥈', '🥉']

function getPeriodStart(period: string): string | null {
  const now = new Date()
  if (period === 'week') {
    const d = new Date(now)
    d.setDate(d.getDate() - 7)
    return d.toISOString()
  }
  if (period === 'month') {
    const d = new Date(now)
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
    return d.toISOString()
  }
  return null
}

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; desde?: string; hasta?: string }>
}) {
  const { periodo = 'month', desde, hasta } = await searchParams
  const supabase = await createClient()

  const { data: members } = await supabase
    .from('profiles')
    .select('id, full_name, photo_url, section, instrument')
    .eq('role', 'member')
    .eq('active', true)
    .order('full_name')

  const { data: attendances } = await supabase
    .from('attendances')
    .select('user_id, status, fine_amount, events(starts_at)')

  // Filtrar por rango personalizado o período rápido
  const hasRange = !!(desde && hasta)
  const periodStart = hasRange ? null : getPeriodStart(periodo)
  const rangeStart = hasRange ? `${desde}T00:00:00` : null
  const rangeEnd   = hasRange ? `${hasta}T23:59:59` : null

  const filtered = (attendances ?? []).filter((a: any) => {
    const eventDate = a.events?.starts_at
    if (!eventDate) return false
    if (hasRange) return eventDate >= rangeStart! && eventDate <= rangeEnd!
    if (periodStart) return eventDate >= periodStart
    return true
  })

  const stats = members?.map(m => {
    const myAtt = filtered.filter((a: any) => a.user_id === m.id)
    const total   = myAtt.length
    const present = myAtt.filter((a: any) => a.status === 'present').length
    const late    = myAtt.filter((a: any) => a.status === 'late').length
    const absent  = myAtt.filter((a: any) => a.status === 'absent').length
    const fines   = myAtt.reduce((sum: number, a: any) => sum + a.fine_amount, 0)
    const pct     = total > 0 ? Math.round(((present + late) / total) * 100) : 0
    return { ...m, total, present, late, absent, fines, pct }
  }) ?? []

  const ranked = [...stats].sort((a, b) => b.pct - a.pct || b.present - a.present)
  const totalFines = filtered.reduce((sum: number, a: any) => sum + a.fine_amount, 0)

  const top3 = ranked.slice(0, 3)
  const rest  = ranked.slice(3)

  // Etiqueta del rango activo para mostrar en el card de multas
  const rangeLabel = hasRange
    ? `${desde} → ${hasta}`
    : periodo === 'week' ? 'últimos 7 días'
    : periodo === 'month' ? 'este mes'
    : 'todo el tiempo'

  return (
    <div className="p-4 space-y-5 max-w-lg mx-auto">
      <div className="pt-6">
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
      </div>

      {/* Filtro de período + rango personalizado */}
      <DateRangeFilter periodo={periodo} desde={desde} hasta={hasta} />

      {/* Total multas */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
        <p className="text-sm text-gray-500">Multas · {rangeLabel}</p>
        <p className="text-3xl font-bold text-red-700">{formatCurrency(totalFines)}</p>
      </div>

      {/* Podio — top 3 */}
      <section>
        <h2 className="font-semibold text-gray-900 mb-3">Ranking de asistencia</h2>
        {top3.length > 0 ? (
          <div className="space-y-2">
            {top3.map((m, i) => (
              <Link
                key={m.id}
                href={`/reportes/miembro/${m.id}`}
                className={`flex items-center gap-3 rounded-xl p-3 shadow-sm border ${
                  i === 0 ? 'bg-amber-50 border-amber-200' :
                  i === 1 ? 'bg-gray-50 border-gray-200' :
                             'bg-orange-50 border-orange-200'
                }`}
              >
                <span className="text-2xl w-8 text-center">{MEDALS[i]}</span>
                {m.photo_url ? (
                  <img src={m.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-sm">
                    {m.full_name?.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{m.full_name}</p>
                  <p className="text-xs text-gray-500">
                    {m.section ? SECTION_LABELS[m.section as SectionName] : 'Sin sección'}
                  </p>
                  {m.total > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {m.present} puntuales · {m.late} tardanzas · {m.absent} faltas
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-lg font-bold ${m.pct >= 80 ? 'text-green-600' : m.pct >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                    {m.pct}%
                  </p>
                  {m.fines > 0 && <p className="text-xs text-red-500">{formatCurrency(m.fines)}</p>}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-6 text-center text-gray-400 border border-dashed border-gray-200">
            Sin datos para este período
          </div>
        )}
      </section>

      {/* Resto de miembros colapsado */}
      {rest.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm text-violet-600 font-medium py-1 select-none list-none flex items-center gap-1">
            <span className="group-open:hidden">▶ Ver todos ({rest.length} más)</span>
            <span className="hidden group-open:inline">▼ Ocultar</span>
          </summary>
          <div className="space-y-2 mt-2">
            {rest.map((m, i) => (
              <Link
                key={m.id}
                href={`/reportes/miembro/${m.id}`}
                className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm border border-gray-100"
              >
                <span className="w-6 text-sm font-bold text-gray-400 text-center">{i + 4}</span>
                {m.photo_url ? (
                  <img src={m.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-sm">
                    {m.full_name?.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{m.full_name}</p>
                  <p className="text-xs text-gray-400">
                    {m.section ? SECTION_LABELS[m.section as SectionName] : 'Sin sección'}
                    {m.total > 0 ? ` · ${m.present}P ${m.late}T ${m.absent}F` : ' · sin datos'}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-bold ${m.pct >= 80 ? 'text-green-600' : m.pct >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                    {m.pct}%
                  </p>
                  {m.fines > 0 && <p className="text-xs text-red-500">{formatCurrency(m.fines)}</p>}
                </div>
              </Link>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
