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

        // El login de miembro ya no se usa (modo kiosco en "/"); solo el director
        // pasa por este flujo. Cualquier cuenta no-director cae al kiosco.
        const dest = profile?.role === 'director' ? '/dashboard' : '/'
        return NextResponse.redirect(`${origin}${dest}`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
