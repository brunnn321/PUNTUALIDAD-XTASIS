import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function redirectTo(url: URL | string, requestId: string) {
  const res = NextResponse.redirect(url)
  // x-middleware-response-* es el mecanismo de Next.js para pasar headers
  // desde el middleware a la response final del servidor.
  res.headers.set('x-middleware-response-x-request-id', requestId)
  return res
}

export async function proxy(request: NextRequest) {
  const requestId = crypto.randomUUID()

  // Propagar requestId hacia los route handlers via request headers.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-request-id', requestId)

  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })
  supabaseResponse.headers.set('x-middleware-response-x-request-id', requestId)

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
          supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })
          supabaseResponse.headers.set('x-middleware-response-x-request-id', requestId)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Rutas públicas
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const dest = profile?.role === 'director' ? '/dashboard' : '/'
      return redirectTo(new URL(dest, request.url), requestId)
    }
    return supabaseResponse
  }

  // Sin sesión → al login
  if (!user) {
    return redirectTo(new URL('/login', request.url), requestId)
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
      return redirectTo(new URL('/home', request.url), requestId)
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
      return redirectTo(new URL('/dashboard', request.url), requestId)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
