import { createClient } from '@/lib/supabase/server'
import { SECTION_LABELS } from '@/lib/utils'
import type { SectionName } from '@/lib/supabase/types'
import { confirmWelcome } from '@/lib/actions/profile'

export default async function BienvenidaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, section, photo_url')
    .eq('id', user!.id)
    .single()

  return (
    <div className="p-4 max-w-lg mx-auto flex flex-col items-center justify-center min-h-[80vh] text-center space-y-6">
      {profile?.photo_url ? (
        <img src={profile.photo_url} alt="" className="w-20 h-20 rounded-full object-cover" />
      ) : (
        <div className="w-20 h-20 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 text-3xl font-bold">
          {profile?.full_name?.charAt(0)}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">¡Bienvenido!</h1>
        <p className="text-gray-600 mt-2">
          ¿Eres{' '}
          <span className="font-semibold text-gray-900">{profile?.full_name}</span>
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
            className="w-full bg-violet-600 text-white py-3 rounded-xl font-semibold hover:bg-violet-700 transition-colors"
          >
            Sí, soy yo → entrar
          </button>
        </form>
        <p className="text-xs text-gray-400">
          ¿No eres tú o hay un error? Contacta al director para corregir tu cuenta.
        </p>
      </div>
    </div>
  )
}
