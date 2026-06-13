import { createClient } from '@/lib/supabase/server'
import { formatDateTime, formatCurrency, STATUS_CONFIG } from '@/lib/utils'
import type { AttendanceStatus } from '@/lib/supabase/types'

export default async function MisMulatasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: fines } = await supabase
    .from('attendances')
    .select('*, events(title, starts_at, event_types(name))')
    .eq('user_id', user!.id)
    .gt('fine_amount', 0)
    .order('created_at', { ascending: false })

  const total = fines?.reduce((sum, f) => sum + f.fine_amount, 0) ?? 0

  return (
    <div className="p-4 space-y-5 max-w-lg mx-auto">
      <div className="pt-6">
        <h1 className="text-2xl font-bold text-gray-900">Mis multas</h1>
      </div>

      {/* Total */}
      <div className={`rounded-2xl p-5 text-center ${total > 0 ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
        <p className="text-sm text-gray-500 mb-1">Total acumulado</p>
        <p className={`text-3xl font-bold ${total > 0 ? 'text-red-700' : 'text-green-700'}`}>
          {formatCurrency(total)}
        </p>
        {total === 0 && <p className="text-sm text-green-600 mt-1">¡Sin multas! Sigue así.</p>}
      </div>

      {/* Detalle */}
      {fines && fines.length > 0 && (
        <section>
          <h2 className="font-semibold text-gray-900 mb-3">Detalle</h2>
          <div className="space-y-2">
            {fines.map((fine: any) => {
              const { label, color, bg } = STATUS_CONFIG[fine.status as AttendanceStatus]
              return (
                <div key={fine.id} className="bg-white rounded-xl p-3 flex items-center justify-between shadow-sm border border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{fine.events?.title}</p>
                    <p className="text-xs text-gray-400">
                      {fine.events?.event_types?.name} · {fine.events?.starts_at ? formatDateTime(fine.events.starts_at) : ''}
                    </p>
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full mt-1 inline-block ${bg} ${color}`}>{label}</span>
                  </div>
                  <p className="font-bold text-red-600 flex-shrink-0 ml-3">{formatCurrency(fine.fine_amount)}</p>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
