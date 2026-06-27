import { createClient } from '@/lib/supabase/server'
import { SECTION_LABELS } from '@/lib/utils'
import type { SectionName } from '@/lib/supabase/types'
import { confirmWelcome } from '@/lib/actions/profile'
import FetchError from '@/components/FetchError'

export default async function BienvenidaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('full_name, section, photo_url')
    .eq('id', user!.id)
    .single()

  if (error) return <FetchError context="No se pudo cargar tu perfil" />

  return (
    <div className="p-4 max-w-lg mx-auto flex flex-col items-center justify-center min-h-[80vh] text-center space-y-6">
      {profile?.photo_url ? (
        <img src={profile.photo_url} alt="" className="w-20 h-20 rounded-full object-cover" />
      ) : (
        <div className="w-20 h-20 rounded-full bg-brand-100 flex items-center justify-center text-brand-500 text-3xl font-bold">
          {profile?.full_name?.charAt(0)}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">¡Bienvenido!</h1>
        <p className="text-foreground/60 mt-2">
          ¿Eres{' '}
          <span className="font-semibold text-foreground">{profile?.full_name}</span>
          {profile?.section && (
            <> · {SECTION_LABELS[profile.section as SectionName]}</>
          )}
          ?
        </p>
      </div>

      <div className="w-full space-y-3 max-w-xs">
        <form action={confirmWelcome}>
          <button
            type="submit"
            className="w-full bg-brand-500 text-white py-3 rounded-xl font-semibold hover:bg-brand-600 transition-colors"
          >
            Sí, soy yo → entrar
          </button>
        </form>
        <p className="text-xs text-foreground/40">
          ¿No eres tú o hay un error? Contacta al director para corregir tu cuenta.
        </p>
      </div>
    </div>
  )
}
