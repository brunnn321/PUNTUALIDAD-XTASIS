import { createClient } from '@/lib/supabase/server'
import { formatDateTime, formatCurrency, STATUS_CONFIG } from '@/lib/utils'
import type { AttendanceStatus } from '@/lib/supabase/types'
import FetchError from '@/components/FetchError'

export default async function MisMulatasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: fines, error: finesError } = await supabase
    .from('attendances')
    .select('*, events(title, starts_at, event_types(name))')
    .eq('user_id', user!.id)
    .gt('fine_amount', 0)
    .order('created_at', { ascending: false })

  if (finesError) return <FetchError context="No se pudieron cargar tus multas" />

  const total = fines?.reduce((sum, f) => sum + f.fine_amount, 0) ?? 0

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-24 space-y-6">
      <h1 className="text-2xl font-bold text-foreground tracking-tight">Mis multas</h1>

      {/* Total */}
      <div className={`rounded-2xl p-5 ${total > 0 ? 'bg-red-50 border border-red-100' : 'bg-green-50 border border-green-100'}`}>
        <p className="text-xs text-foreground/40 mb-1">Total acumulado</p>
        <p className={`text-3xl font-bold tabular-nums ${total > 0 ? 'text-red-700' : 'text-green-700'}`}>
          {formatCurrency(total)}
        </p>
        {total === 0 && <p className="text-sm text-green-600 mt-1">Sin multas. Sigue así.</p>}
      </div>

      {/* Detalle */}
      {fines && fines.length > 0 && (
        <section className="space-y-2">
          {fines.map((fine: any) => {
            const { label, color, bg } = STATUS_CONFIG[fine.status as AttendanceStatus]
            return (
              <div key={fine.id} className="bg-white rounded-xl border border-foreground/6 overflow-hidden">
                <div className="px-3 py-1.5 bg-red-50 flex items-center justify-between">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${bg} ${color}`}>{label}</span>
                  <p className="font-bold text-red-600 text-sm tabular-nums">{formatCurrency(fine.fine_amount)}</p>
                </div>
                <div className="px-3 py-2.5">
                  <p className="font-medium text-foreground text-sm">{fine.events?.title}</p>
                  <p className="text-xs text-foreground/40 mt-0.5">
                    {fine.events?.event_types?.name} · {fine.events?.starts_at ? formatDateTime(fine.events.starts_at) : ''}
                  </p>
                </div>
              </div>
            )
          })}
        </section>
      )}
    </div>
  )
}
