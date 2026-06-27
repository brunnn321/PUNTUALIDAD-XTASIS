import { createClient } from '@/lib/supabase/server'
import ProfileForm from '@/components/member/ProfileForm'
import FetchError from '@/components/FetchError'

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  if (error) return <FetchError context="No se pudo cargar tu perfil" />

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="pt-6 mb-6">
        <h1 className="text-2xl font-bold text-foreground">Mi perfil</h1>
      </div>
      {profile && <ProfileForm profile={profile} />}
    </div>
  )
}
