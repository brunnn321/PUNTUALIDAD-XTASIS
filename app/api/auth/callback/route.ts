import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Obtener el perfil para redirigir según el rol
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, section, welcomed')
          .eq('id', user.id)
          .single()

        // Primer ingreso del miembro: pantalla de bienvenida única
        if (profile?.role === 'member' && profile?.welcomed === false) {
          return NextResponse.redirect(`${origin}/bienvenida`)
        }

        // Si falta completar el perfil (sección/instrumento)
        if (profile?.role === 'member' && !profile?.section) {
          return NextResponse.redirect(`${origin}/perfil?onboarding=true`)
        }

        const dest = profile?.role === 'director' ? '/dashboard' : '/home'
        return NextResponse.redirect(`${origin}${dest}`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
