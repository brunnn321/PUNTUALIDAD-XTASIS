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
      <div className="pt-6 mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Mi perfil</h1>
        <LogoutButton />
      </div>
      {profile && <ProfileForm profile={profile} />}
    </div>
  )
}

function LogoutButton() {
  return (
    <form action="/api/auth/logout" method="POST">
      <button type="submit" className="text-sm text-red-500 font-medium">
        Cerrar sesión
      </button>
    </form>
  )
}
