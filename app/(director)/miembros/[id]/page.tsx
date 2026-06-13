import { createClient } from '@/lib/supabase/server'
import { SECTION_LABELS, STATUS_CONFIG, formatCurrency, formatDateTime } from '@/lib/utils'
import type { SectionName, AttendanceStatus } from '@/lib/supabase/types'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Music, Users, Pencil } from 'lucide-react'

export default async function MiembroDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: member } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (!member) notFound()

  // Obtener email desde auth.users via admin (puede no estar disponible con anon key)
  const { data: attendances } = await supabase
    .from('attendances')
    .select('status, fine_amount, checked_in_at, events(title, starts_at, event_types(name))')
    .eq('user_id', id)
    .order('created_at', { ascending: false })
    .limit(20)

  const total = attendances?.length ?? 0
  const present = attendances?.filter(a => a.status === 'present').length ?? 0
  const late = attendances?.filter(a => a.status === 'late').length ?? 0
  const absent = attendances?.filter(a => a.status === 'absent').length ?? 0
  const totalFines = attendances?.reduce((sum, a) => sum + (a.fine_amount ?? 0), 0) ?? 0
  const pct = total > 0 ? Math.round(((present + late) / total) * 100) : null

  return (
    <div className="p-4 max-w-lg mx-auto space-y-5">
      <div className="pt-4 flex items-center justify-between">
        <Link href="/miembros" className="flex items-center gap-1 text-sm text-violet-600">
          <ChevronLeft size={16} /> Miembros
        </Link>
        <Link
          href={`/miembros/${id}/editar?name=${encodeURIComponent(member.full_name ?? '')}&section=${member.section ?? ''}&instrument=${encodeURIComponent(member.instrument ?? '')}&active=${member.active}`}
          className="flex items-center gap-1.5 text-sm text-violet-600 font-medium"
        >
          <Pencil size={14} /> Editar
        </Link>
      </div>

      {/* Perfil */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
        {member.photo_url ? (
          <img src={member.photo_url} alt="" className="w-16 h-16 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-2xl flex-shrink-0">
            {member.full_name?.charAt(0)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">{member.full_name}</h1>
          <div className="mt-1 space-y-0.5">
            {member.section && (
              <p className="text-sm text-gray-500 flex items-center gap-1.5">
                <Users size={13} className="text-gray-400" />
                {SECTION_LABELS[member.section as SectionName]}
              </p>
            )}
            {member.instrument && (
              <p className="text-sm text-gray-500 flex items-center gap-1.5">
                <Music size={13} className="text-gray-400" />
                {member.instrument}
              </p>
            )}
          </div>
          <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium ${
            member.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {member.active ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      </div>

      {/* Stats de asistencia */}
      {total > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Presentes', value: present, color: 'text-green-600' },
            { label: 'Tardanzas', value: late,    color: 'text-amber-600' },
            { label: 'Faltas',    value: absent,  color: 'text-red-600'   },
            { label: pct !== null ? `${pct}%` : '—', value: '', color: 'text-violet-600', subtitle: 'Asistencia' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
              <p className={`text-xl font-bold ${s.color}`}>{s.value !== '' ? s.value : s.label}</p>
              <p className="text-xs text-gray-400">{s.subtitle ?? s.label}</p>
            </div>
          ))}
        </div>
      )}

      {totalFines > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
          <p className="text-sm text-red-600">Multas acumuladas: <strong>{formatCurrency(totalFines)}</strong></p>
        </div>
      )}

      {/* Historial */}
      <section>
        <h2 className="font-semibold text-gray-900 mb-3">Historial de asistencia</h2>
        {attendances && attendances.length > 0 ? (
          <div className="space-y-2">
            {attendances.map((a: any, i) => {
              const { label, color, bg } = STATUS_CONFIG[a.status as AttendanceStatus]
              return (
                <div key={i} className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm border border-gray-100">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{a.events?.title}</p>
                    <p className="text-xs text-gray-400">
                      {a.events?.event_types?.name}
                      {a.events?.starts_at ? ` · ${formatDateTime(a.events.starts_at)}` : ''}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${bg} ${color}`}>{label}</span>
                    {a.fine_amount > 0 && (
                      <p className="text-xs text-red-500 mt-0.5">{formatCurrency(a.fine_amount)}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-6 text-center text-gray-400 border border-dashed border-gray-200">
            Sin registros de asistencia
          </div>
        )}
      </section>
    </div>
  )
}
