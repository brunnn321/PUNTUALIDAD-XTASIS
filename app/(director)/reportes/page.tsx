import { createClient } from '@/lib/supabase/server'
import { formatCurrency, SECTION_LABELS } from '@/lib/utils'
import type { SectionName } from '@/lib/supabase/types'
import Link from 'next/link'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default async function ReportesPage() {
  const supabase = await createClient()

  // Todos los miembros activos con sus asistencias
  const { data: members } = await supabase
    .from('profiles')
    .select('id, full_name, photo_url, section, instrument')
    .eq('role', 'member')
    .eq('active', true)
    .order('full_name')

  const { data: attendances } = await supabase
    .from('attendances')
    .select('user_id, status, fine_amount')

  // Calcular stats por miembro
  const stats = members?.map(m => {
    const myAtt = attendances?.filter(a => a.user_id === m.id) ?? []
    const total = myAtt.length
    const present = myAtt.filter(a => a.status === 'present').length
    const late = myAtt.filter(a => a.status === 'late').length
    const absent = myAtt.filter(a => a.status === 'absent').length
    const fines = myAtt.reduce((sum, a) => sum + a.fine_amount, 0)
    const pct = total > 0 ? Math.round(((present + late) / total) * 100) : 0
    return { ...m, total, present, late, absent, fines, pct }
  }) ?? []

  // Ordenar por porcentaje descendente
  const ranked = [...stats].sort((a, b) => b.pct - a.pct)

  const totalFines = attendances?.reduce((sum, a) => sum + a.fine_amount, 0) ?? 0

  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto">
      <div className="pt-6">
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
      </div>

      {/* Total multas */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
        <p className="text-sm text-gray-500">Total multas acumuladas (grupo)</p>
        <p className="text-3xl font-bold text-red-700">{formatCurrency(totalFines)}</p>
      </div>

      {/* Ranking de asistencia */}
      <section>
        <h2 className="font-semibold text-gray-900 mb-3">Ranking de asistencia</h2>
        <div className="space-y-2">
          {ranked.map((m, i) => (
            <Link
              key={m.id}
              href={`/reportes/miembro/${m.id}`}
              className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm border border-gray-100"
            >
              <span className="w-6 text-sm font-bold text-gray-400 text-center">{i + 1}</span>
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
                <AttPct pct={m.pct} />
                {m.fines > 0 && <p className="text-xs text-red-500">{formatCurrency(m.fines)}</p>}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

function AttPct({ pct }: { pct: number }) {
  const color = pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-amber-600' : 'text-red-600'
  const Icon = pct >= 80 ? TrendingUp : pct >= 60 ? Minus : TrendingDown
  return (
    <div className={`flex items-center gap-1 font-bold text-sm ${color}`}>
      <Icon size={14} />
      {pct}%
    </div>
  )
}
