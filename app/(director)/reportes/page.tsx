import { createClient } from '@/lib/supabase/server'
import { formatCurrency, SECTION_LABELS } from '@/lib/utils'
import type { SectionName } from '@/lib/supabase/types'
import Link from 'next/link'
import DateRangeFilter from '@/components/director/DateRangeFilter'
import FetchError from '@/components/FetchError'

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

  const { data: members, error: membersError } = await supabase
    .from('profiles')
    .select('id, full_name, photo_url, section, instrument')
    .eq('role', 'member')
    .eq('active', true)
    .order('full_name')

  const { data: attendances, error: attendancesError } = await supabase
    .from('attendances')
    .select('user_id, status, fine_amount, events(starts_at)')

  if (membersError || attendancesError) {
    return <FetchError context="No se pudo cargar el reporte" />
  }

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
    <div className="max-w-lg mx-auto px-4 pt-8 pb-24 space-y-5">
      <h1 className="text-2xl font-bold text-foreground tracking-tight">Reportes</h1>

      <DateRangeFilter periodo={periodo} desde={desde} hasta={hasta} />

      {/* Total multas */}
      <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
        <p className="text-xs text-foreground/40 mb-1">Multas · {rangeLabel}</p>
        <p className="text-3xl font-bold text-red-700 tabular-nums">{formatCurrency(totalFines)}</p>
      </div>

      {/* Ranking — top 3 */}
      {top3.length > 0 ? (
        <section className="space-y-2">
          {top3.map((m, i) => (
            <Link
              key={m.id}
              href={`/reportes/miembro/${m.id}`}
              className={`flex items-center gap-3 rounded-xl p-3 border ${
                i === 0 ? 'bg-amber-50 border-amber-200' :
                i === 1 ? 'bg-foreground/4 border-foreground/8' :
                           'bg-orange-50 border-orange-200'
              }`}
            >
              <span className="text-2xl w-8 text-center flex-shrink-0">{MEDALS[i]}</span>
              {m.photo_url ? (
                <img src={m.photo_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-500 font-bold text-sm flex-shrink-0">
                  {m.full_name?.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm truncate">{m.full_name}</p>
                <p className="text-xs text-foreground/45">
                  {m.section ? SECTION_LABELS[m.section as SectionName] : 'Sin sección'}
                </p>
                {m.total > 0 && (
                  <p className="text-xs text-foreground/35 mt-0.5">
                    {m.present} puntuales · {m.late} tardanzas · {m.absent} faltas
                  </p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`text-lg font-bold tabular-nums ${m.pct >= 80 ? 'text-green-600' : m.pct >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                  {m.pct}%
                </p>
                {m.fines > 0 && <p className="text-xs text-red-500">{formatCurrency(m.fines)}</p>}
              </div>
            </Link>
          ))}
        </section>
      ) : (
        <div className="rounded-xl p-6 text-center border-2 border-dashed border-foreground/8">
          <p className="text-sm text-foreground/35">Sin datos para este período</p>
        </div>
      )}

      {/* Resto de miembros colapsado */}
      {rest.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm text-brand-500 font-medium py-1 select-none list-none flex items-center gap-1">
            <span className="group-open:hidden">▶ Ver todos ({rest.length} más)</span>
            <span className="hidden group-open:inline">▼ Ocultar</span>
          </summary>
          <div className="space-y-2 mt-2">
            {rest.map((m, i) => (
              <Link
                key={m.id}
                href={`/reportes/miembro/${m.id}`}
                className="flex items-center gap-3 bg-white rounded-xl p-3 border border-foreground/6"
              >
                <span className="w-6 text-sm font-bold text-foreground/30 text-center flex-shrink-0">{i + 4}</span>
                {m.photo_url ? (
                  <img src={m.photo_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-500 font-bold text-sm flex-shrink-0">
                    {m.full_name?.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">{m.full_name}</p>
                  <p className="text-xs text-foreground/40 mt-0.5">
                    {m.section ? SECTION_LABELS[m.section as SectionName] : 'Sin sección'}
                    {m.total > 0 ? ` · ${m.present}P ${m.late}T ${m.absent}F` : ' · sin datos'}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-bold tabular-nums ${m.pct >= 80 ? 'text-green-600' : m.pct >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
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
