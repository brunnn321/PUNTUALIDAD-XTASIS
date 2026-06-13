import { createClient } from '@/lib/supabase/server'
import { formatCurrency, SECTION_LABELS, STATUS_CONFIG } from '@/lib/utils'
import type { SectionName, AttendanceStatus } from '@/lib/supabase/types'
import Link from 'next/link'
import { ChevronLeft, ChevronDown, ChevronRight } from 'lucide-react'

export default async function MultasPage() {
  const supabase = await createClient()

  const { data: members } = await supabase
    .from('profiles')
    .select('id, full_name, photo_url, section')
    .eq('role', 'member')
    .eq('active', true)
    .order('full_name')

  const { data: fines } = await supabase
    .from('attendances')
    .select('user_id, fine_amount, status, events(title, starts_at, event_types(name))')
    .gt('fine_amount', 0)
    .order('created_at', { ascending: false })

  // Agrupar multas por miembro
  const byMember = members?.map(m => {
    const myFines = (fines as any[])?.filter(f => f.user_id === m.id) ?? []
    const total = myFines.reduce((sum: number, f: any) => sum + f.fine_amount, 0)
    return { ...m, fines: myFines, total }
  }).filter(m => m.total > 0)
    .sort((a, b) => b.total - a.total) ?? []

  const grandTotal = byMember.reduce((sum, m) => sum + m.total, 0)

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
        <p className="text-red-200 text-sm mt-1">{byMember.length} miembros con deuda</p>
      </div>

      {/* Lista por miembro */}
      {byMember.length > 0 ? (
        <div className="space-y-3">
          {byMember.map(m => (
            <details key={m.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <summary className="flex items-center gap-3 p-3 cursor-pointer list-none">
                {m.photo_url ? (
                  <img src={m.photo_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-sm flex-shrink-0">
                    {m.full_name?.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{m.full_name}</p>
                  <p className="text-xs text-gray-400">
                    {m.section ? SECTION_LABELS[m.section as SectionName] : 'Sin sección'} · {m.fines.length} multa{m.fines.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <p className="font-bold text-red-600 flex-shrink-0">{formatCurrency(m.total)}</p>
              </summary>

              {/* Detalle de multas */}
              <div className="border-t border-gray-100 divide-y divide-gray-50">
                {m.fines.map((f: any, i: number) => {
                  const { label, color, bg } = STATUS_CONFIG[f.status as AttendanceStatus]
                  return (
                    <div key={i} className="flex items-center justify-between px-4 py-2.5">
                      <div>
                        <p className="text-sm text-gray-700">{f.events?.title}</p>
                        <p className="text-xs text-gray-400">{f.events?.event_types?.name}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${bg} ${color}`}>{label}</span>
                        <p className="text-sm font-semibold text-red-600 mt-0.5">{formatCurrency(f.fine_amount)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </details>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl p-8 text-center text-gray-400 border border-dashed border-gray-200">
          No hay multas pendientes
        </div>
      )}
    </div>
  )
}
