import { createClient } from '@/lib/supabase/server'
import { formatDateTime, formatCurrency } from '@/lib/utils'
import { Calendar, Users, DollarSign, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user!.id)
    .single()

  const today = new Date()
  const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString()
  const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString()

  // Eventos de hoy
  const { data: todayEvents } = await supabase
    .from('events')
    .select('*, event_types(name)')
    .gte('starts_at', startOfDay)
    .lte('starts_at', endOfDay)
    .order('starts_at')

  // Total de multas pendientes
  const { data: finesRaw } = await supabase
    .from('attendances')
    .select('fine_amount')
    .gt('fine_amount', 0)

  const fines = finesRaw as Array<{ fine_amount: number }> | null
  const totalFines = fines?.reduce((sum, a) => sum + a.fine_amount, 0) ?? 0

  // Miembros activos
  const { count: membersCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('active', true)
    .eq('role', 'member')

  // Próximo evento
  const { data: nextEvent } = await supabase
    .from('events')
    .select('*, event_types(name)')
    .gt('starts_at', new Date().toISOString())
    .neq('status', 'closed')
    .order('starts_at')
    .limit(1)
    .single()

  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="pt-6">
        <p className="text-sm text-gray-500">Bienvenido</p>
        <h1 className="text-2xl font-bold text-gray-900">{profile?.full_name?.split(' ')[0]} 👋</h1>
      </div>

      {/* Stats rápidos */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Users size={20} className="text-violet-600" />}
          label="Miembros activos"
          value={String(membersCount ?? 0)}
          bg="bg-violet-50"
        />
        <StatCard
          icon={<DollarSign size={20} className="text-red-500" />}
          label="Multas pendientes"
          value={formatCurrency(totalFines)}
          bg="bg-red-50"
        />
      </div>

      {/* Próximo evento */}
      {nextEvent && (
        <div className="bg-violet-600 text-white rounded-2xl p-4 space-y-1">
          <p className="text-violet-200 text-xs font-medium uppercase tracking-wide">Próximo evento</p>
          <p className="font-semibold text-lg">{nextEvent.title}</p>
          <p className="text-violet-200 text-sm">
            {(nextEvent as any).event_types?.name} · {formatDateTime(nextEvent.starts_at)}
          </p>
          <Link
            href={`/eventos/${nextEvent.id}`}
            className="inline-block mt-2 bg-white text-violet-700 text-sm font-medium px-3 py-1.5 rounded-lg"
          >
            Ver asistencia →
          </Link>
        </div>
      )}

      {/* Eventos de hoy */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Calendar size={18} /> Hoy
          </h2>
          <Link href="/eventos" className="text-sm text-violet-600">Ver todos</Link>
        </div>

        {todayEvents && todayEvents.length > 0 ? (
          <div className="space-y-2">
            {todayEvents.map((event: any) => (
              <Link
                key={event.id}
                href={`/eventos/${event.id}`}
                className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-gray-100"
              >
                <div>
                  <p className="font-medium text-gray-900">{event.title}</p>
                  <p className="text-sm text-gray-500">
                    {event.event_types?.name} · {formatDateTime(event.starts_at)}
                  </p>
                </div>
                <StatusBadge status={event.status} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-6 text-center text-gray-400 border border-dashed border-gray-200">
            No hay eventos hoy
          </div>
        )}
      </section>

      {/* Acciones rápidas */}
      <section>
        <h2 className="font-semibold text-gray-900 mb-3">Acciones rápidas</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/eventos/nuevo" className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <Calendar size={24} className="mx-auto text-violet-600 mb-1" />
            <p className="text-sm font-medium text-gray-700">Crear evento</p>
          </Link>
          <Link href="/reportes" className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <TrendingUp size={24} className="mx-auto text-violet-600 mb-1" />
            <p className="text-sm font-medium text-gray-700">Ver reportes</p>
          </Link>
        </div>
      </section>

      <LogoutButton />
    </div>
  )
}

function StatCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: string; bg: string }) {
  return (
    <div className={`${bg} rounded-xl p-4 space-y-1`}>
      {icon}
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-bold text-gray-900">{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    scheduled: { label: 'Programado', color: 'bg-blue-100 text-blue-700' },
    open:      { label: 'Abierto',    color: 'bg-green-100 text-green-700' },
    closed:    { label: 'Cerrado',    color: 'bg-gray-100 text-gray-600' },
  }
  const { label, color } = map[status] ?? { label: status, color: 'bg-gray-100 text-gray-600' }
  return <span className={`text-xs font-medium px-2 py-1 rounded-full ${color}`}>{label}</span>
}
