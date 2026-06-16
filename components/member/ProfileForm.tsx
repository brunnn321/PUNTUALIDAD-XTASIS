'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Profile, SectionName } from '@/lib/supabase/types'
import { SECTION_LABELS } from '@/lib/utils'
import { Camera } from 'lucide-react'

export default function ProfileForm({ profile }: { profile: Profile }) {
  const [fullName, setFullName] = useState(profile.full_name)
  const section = profile.section ?? ''
  const instrument = profile.instrument ?? ''
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()

    let photoUrl = profile.photo_url

    if (photoFile) {
      const path = `${profile.id}/avatar.jpg`
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(path, photoFile, { upsert: true, contentType: photoFile.type })

      if (!uploadError) {
        const { data } = supabase.storage.from('profile-photos').getPublicUrl(path)
        // Cachebust para que el navegador no sirva la imagen antigua
        photoUrl = `${data.publicUrl}?t=${Date.now()}`
      }
    }

    const nameChanged = fullName !== profile.full_name && !profile.name_edited

    await supabase
      .from('profiles')
      .update({
        ...(profile.name_edited ? {} : { full_name: fullName }),
        ...(photoUrl !== profile.photo_url ? { photo_url: photoUrl } : {}),
        ...(nameChanged ? { name_edited: true } : {}),
      })
      .eq('id', profile.id)

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setLoading(false)
    router.refresh()
  }

  const avatarSrc = photoPreview ?? profile.photo_url

  return (
    <div className="space-y-6">
      {/* Avatar con opción de cambiar */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative flex-shrink-0 group"
          title="Cambiar foto de perfil"
        >
          {avatarSrc ? (
            <img src={avatarSrc} alt="" className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 text-2xl font-bold">
              {profile.full_name?.charAt(0)}
            </div>
          )}
          <span className="absolute bottom-0 right-0 w-6 h-6 bg-violet-600 rounded-full flex items-center justify-center shadow-sm group-hover:bg-violet-700 transition-colors">
            <Camera size={12} className="text-white" />
          </span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handlePhotoChange}
        />
        <div>
          <p className="font-semibold text-gray-900">{profile.full_name}</p>
          <p className="text-sm text-gray-400">
            {photoPreview ? 'Foto lista para guardar' : 'Toca la foto para cambiarla'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Nombre completo</label>
          {profile.name_edited ? (
            <>
              <p className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700">
                {profile.full_name}
              </p>
              <p className="text-xs text-gray-400">Ya usaste tu cambio de nombre. Solo el director puede modificarlo de nuevo.</p>
            </>
          ) : (
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Sección</label>
          <p className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700">
            {section ? SECTION_LABELS[section as SectionName] : 'Sin sección asignada'}
          </p>
          <p className="text-xs text-gray-400">Solo el director puede cambiar tu sección.</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Instrumento o rol</label>
          <p className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700">
            {instrument || 'Sin instrumento asignado'}
          </p>
          <p className="text-xs text-gray-400">Solo el director puede cambiar tu instrumento.</p>
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
