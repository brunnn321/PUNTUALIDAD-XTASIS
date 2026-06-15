'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'

export default function DateRangeFilter({
  desde,
  hasta,
  periodo,
}: {
  desde?: string
  hasta?: string
  periodo: string
}) {
  const [from, setFrom] = useState(desde ?? '')
  const [to, setTo]   = useState(hasta ?? '')
  const router = useRouter()

  const hasRange = !!(desde && hasta)

  function apply() {
    if (!from || !to) return
    router.push(`/reportes?desde=${from}&hasta=${to}`)
  }

  function clear() {
    setFrom('')
    setTo('')
    router.push('/reportes?periodo=month')
  }

  const PERIODOS = [
    { label: 'Esta semana', value: 'week' },
    { label: 'Este mes',    value: 'month' },
    { label: 'Todo',        value: 'all' },
  ]

  return (
    <div className="space-y-2">
      {/* Período rápido */}
      <div className="flex gap-2">
        {PERIODOS.map(p => (
          <button
            key={p.value}
            onClick={() => { setFrom(''); setTo(''); router.push(`/reportes?periodo=${p.value}`) }}
            className={`flex-1 text-center text-sm py-2 rounded-xl border font-medium transition-colors ${
              !hasRange && periodo === p.value
                ? 'bg-violet-600 text-white border-violet-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Rango personalizado */}
      <div className={`rounded-xl border p-3 space-y-2 transition-colors ${hasRange ? 'border-violet-400 bg-violet-50' : 'border-gray-200 bg-white'}`}>
        <p className="text-xs font-medium text-gray-500">Rango personalizado</p>
        <div className="flex gap-2 items-center">
          <div className="flex-1 space-y-1">
            <label className="text-[10px] text-gray-400 uppercase tracking-wide">Desde</label>
            <input
              type="date"
              value={from}
              onChange={e => setFrom(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-[10px] text-gray-400 uppercase tracking-wide">Hasta</label>
            <input
              type="date"
              value={to}
              min={from}
              onChange={e => setTo(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={apply}
            disabled={!from || !to}
            className="flex-1 flex items-center justify-center gap-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-sm font-medium py-2 rounded-lg transition-colors"
          >
            <Search size={13} /> Aplicar
          </button>
          {hasRange && (
            <button
              onClick={clear}
              className="flex items-center gap-1 text-sm text-gray-500 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X size={13} /> Limpiar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
