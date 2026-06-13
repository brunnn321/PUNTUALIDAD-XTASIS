import { createClient } from '@/lib/supabase/server'
import { formatDateTime, formatCurrency, SECTION_LABELS, STATUS_CONFIG } from '@/lib/utils'
import type { AttendanceStatus, SectionName } from '@/lib/supabase/types'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default async function MemberReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: member } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (!member) notFound()

  const { data: attendances } = await supabase
    .from('attendances')
    .select('*, events(title, starts_at, event_types(name))')
    .eq('user_id', id)
    .order('created_at', { ascending: false })

  const total = attendances?.length ?? 0
  const present = attendances?.filter(a => a.status === 'present').length ?? 0
  const late = attendances?.filter(a => a.status === 'late').length ?? 0
  const absent = attendances?.filter(a => a.status === 'absent').length ?? 0
  const totalFines = attendances?.reduce((sum, a) => sum + a.fine_amount, 0) ?? 0
  const pct = total > 0 ? Math.round(((present + late) / total) * 100) : 0

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
        <Stat label="Tardanzas" value={late} color="text-amber-600" />
        <Stat label="Faltas" value={absent} color="text-red-600" />
      </div>

      {/* Historial completo */}
      <section>
        <h2 className="font-semibold text-gray-900 mb-3">Historial completo</h2>
        {attendances && attendances.length > 0 ? (
          <div className="space-y-2">
            {attendances.map((att: any) => {
              const { label, color, bg } = STATUS_CONFIG[att.status as AttendanceStatus]
              return (
                <div key={att.id} className="bg-white rounded-xl p-3 flex items-center justify-between shadow-sm border border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{att.events?.title}</p>
                    <p className="text-xs text-gray-400">
                      {att.events?.event_types?.name} · {att.events?.starts_at ? formatDateTime(att.events.starts_at) : ''}
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
          <div className="bg-white rounded-xl p-6 text-center text-gray-400 border border-dashed border-gray-200">
            Sin eventos registrados
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
