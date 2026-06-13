'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Profile, SectionName } from '@/lib/supabase/types'
import { SECTION_LABELS } from '@/lib/utils'

const SECTIONS = Object.entries(SECTION_LABELS) as [SectionName, string][]

export default function ProfileForm({ profile }: { profile: Profile }) {
  const [fullName, setFullName] = useState(profile.full_name)
  const [section, setSection] = useState<SectionName | ''>(profile.section ?? '')
  const [instrument, setInstrument] = useState(profile.instrument ?? '')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        section: section || null,
        instrument: instrument || null,
      })
      .eq('id', profile.id)

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        {profile.photo_url ? (
          <img src={profile.photo_url} alt="" className="w-16 h-16 rounded-full object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 text-2xl font-bold">
            {profile.full_name?.charAt(0)}
          </div>
        )}
        <div>
          <p className="font-semibold text-gray-900">{profile.full_name}</p>
          <p className="text-sm text-gray-400">Foto sincronizada con Google</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Nombre completo</label>
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Sección</label>
          <div className="flex flex-wrap gap-2">
            {SECTIONS.map(([sec, label]) => (
              <button
                key={sec}
                type="button"
                onClick={() => setSection(sec)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  section === sec
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-white text-gray-600 border-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Instrumento o rol</label>
          <input
            type="text"
            value={instrument}
            onChange={e => setInstrument(e.target.value)}
            placeholder="Ej: Trompeta, Voz principal, Bajo..."
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-violet-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50 transition-colors"
        >
          {saved ? '¡Guardado!' : loading ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  )
}
