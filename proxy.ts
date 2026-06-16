import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Raíz: kiosco público de check-in para miembros, sin sesión requerida.
  // app/page.tsx decide internamente si redirige al director a /dashboard.
  if (pathname === '/') {
    return supabaseResponse
  }

  // Rutas públicas
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
    if (user) {
      // Ya autenticado → redirigir según rol
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const dest = profile?.role === 'director' ? '/dashboard' : '/'
      return NextResponse.redirect(new URL(dest, request.url))
    }
    return supabaseResponse
  }

  // Sin sesión → al login
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Proteger rutas de director
  if (pathname.startsWith('/dashboard') ||
      pathname.startsWith('/eventos') ||
      pathname.startsWith('/miembros') ||
      pathname.startsWith('/reportes') ||
      pathname.startsWith('/configuracion')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'director') {
      return NextResponse.redirect(new URL('/home', request.url))
    }
  }

  // Proteger rutas de miembro
  if (pathname.startsWith('/home') ||
      pathname.startsWith('/mis-eventos') ||
      pathname.startsWith('/mis-multas') ||
      pathname.startsWith('/perfil') ||
      pathname.startsWith('/bienvenida')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'director') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
