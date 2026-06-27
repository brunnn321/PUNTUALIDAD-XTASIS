'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'

export default function DateRangeFilter({
  desde,
  hasta,
  periodo,
  basePath = '/reportes',
}: {
  desde?: string
  hasta?: string
  periodo: string
  basePath?: string
}) {
  const today = new Date().toISOString().slice(0, 10)
  const [from, setFrom] = useState(desde ?? today)
  const [to, setTo]   = useState(hasta ?? today)
  const router = useRouter()

  const hasRange = !!(desde && hasta)

  function apply() {
    if (!from || !to) return
    router.push(`${basePath}?desde=${from}&hasta=${to}`)
  }

  function clear() {
    setFrom('')
    setTo('')
    router.push(`${basePath}?periodo=month`)
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
            onClick={() => { setFrom(''); setTo(''); router.push(`${basePath}?periodo=${p.value}`) }}
            className={`flex-1 text-center text-sm py-2 rounded-xl border font-medium transition-colors ${
              !hasRange && periodo === p.value
                ? 'bg-brand-500 text-white border-brand-500'
                : 'bg-white text-foreground/60 border-foreground/12 hover:border-brand-300'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Rango personalizado */}
      <div className={`rounded-xl border p-3 space-y-2 transition-colors ${hasRange ? 'border-brand-400 bg-brand-50' : 'border-foreground/12 bg-white'}`}>
        <p className="text-xs font-medium text-foreground/50">Rango personalizado</p>
        <div className="flex gap-2 items-center">
          <div className="flex-1 space-y-1">
            <label className="text-[10px] text-foreground/40 uppercase tracking-wide">Desde</label>
            <input
              type="date"
              value={from}
              onChange={e => setFrom(e.target.value)}
              className="w-full border border-foreground/12 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-[10px] text-foreground/40 uppercase tracking-wide">Hasta</label>
            <input
              type="date"
              value={to}
              min={from}
              onChange={e => setTo(e.target.value)}
              className="w-full border border-foreground/12 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={apply}
            disabled={!from || !to}
            className="flex-1 flex items-center justify-center gap-1.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white text-sm font-medium py-2 rounded-lg transition-colors"
          >
            <Search size={13} /> Aplicar
          </button>
          {hasRange && (
            <button
              onClick={clear}
              className="flex items-center gap-1 text-sm text-foreground/50 border border-foreground/12 px-3 py-2 rounded-lg hover:bg-foreground/4 transition-colors"
            >
              <X size={13} /> Limpiar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
