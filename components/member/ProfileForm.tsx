'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Profile, SectionName } from '@/lib/supabase/types'
import { SECTION_LABELS } from '@/lib/utils'
import { Camera, Check, Lock } from 'lucide-react'

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
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative flex-shrink-0 group btn-focus rounded-full"
          title="Cambiar foto de perfil"
        >
          {avatarSrc ? (
            <img src={avatarSrc} alt="" className="w-16 h-16 rounded-full object-cover shadow-e1" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-2xl font-bold shadow-e1">
              {profile.full_name?.charAt(0)}
            </div>
          )}
          <span className="absolute bottom-0 right-0 w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center shadow-e1 group-hover:bg-brand-600 transition-colors">
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
          <p className="font-semibold text-foreground">{profile.full_name}</p>
          <p className="text-sm text-foreground/40">
            {photoPreview ? 'Foto lista para guardar' : 'Toca la foto para cambiarla'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <Field label="Nombre completo">
          {profile.name_edited ? (
            <div className="space-y-1">
              <div className="input-base text-foreground/60 flex items-center justify-between">
                <span>{profile.full_name}</span>
                <Lock size={13} className="text-foreground/25 flex-shrink-0" />
              </div>
              <p className="text-xs text-foreground/40">Ya usaste tu cambio de nombre. Solo el director puede modificarlo.</p>
            </div>
          ) : (
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="input-base btn-focus"
            />
          )}
        </Field>

        <Field label="Sección">
          <div className="space-y-1">
            <div className="input-base text-foreground/60 flex items-center justify-between">
              <span>{section ? SECTION_LABELS[section as SectionName] : 'Sin sección asignada'}</span>
              <Lock size={13} className="text-foreground/25 flex-shrink-0" />
            </div>
            <p className="text-xs text-foreground/40">Solo el director puede cambiar tu sección.</p>
          </div>
        </Field>

        <Field label="Instrumento o rol">
          <div className="space-y-1">
            <div className="input-base text-foreground/60 flex items-center justify-between">
              <span>{instrument || 'Sin instrumento asignado'}</span>
              <Lock size={13} className="text-foreground/25 flex-shrink-0" />
            </div>
            <p className="text-xs text-foreground/40">Solo el director puede cambiar tu instrumento.</p>
          </div>
        </Field>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-500 hover:bg-brand-600 active:scale-[0.98] text-white py-3 rounded-xl font-semibold transition-all duration-150 shadow-e1 btn-focus disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
        >
          {saved ? (
            <><Check size={16} /> Guardado</>
          ) : loading ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando…</>
          ) : 'Guardar cambios'}
        </button>
      </form>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-foreground/65">{label}</label>
      {children}
    </div>
  )
}
