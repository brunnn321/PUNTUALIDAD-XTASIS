import { createClient } from '@/lib/supabase/server'
import ProfileForm from '@/components/member/ProfileForm'

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="pt-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mi perfil</h1>
      </div>
      {profile && <ProfileForm profile={profile} />}
    </div>
  )
}
