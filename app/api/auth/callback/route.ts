import { createServerClient } from '@supabase/ssr'
import { logError, logInfo } from '@/lib/logger'
import { logSupabaseError } from '@/lib/supabase/query-helpers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? undefined
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    logError('auth/callback: missing code param', { requestId })
    return NextResponse.redirect(`${origin}/login?error=auth`)
  }

  // El redirect final se muta a medida que Supabase setea cookies en setAll
  // Empezamos apuntando a error; se reemplaza al final si todo sale bien
  const cookieJar: Array<{ name: string; value: string; options: Record<string, unknown> }> = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieJar.push({ name, value, options: options ?? {} })
          })
        },
      },
    }
  )

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (logSupabaseError('auth/callback: exchangeCodeForSession', exchangeError, { requestId })) {
    return NextResponse.redirect(`${origin}/login?error=auth`)
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (logSupabaseError('auth/callback: getUser', userError, { requestId }) || !user) {
    logError('auth/callback: no user after successful code exchange', { requestId })
    return NextResponse.redirect(`${origin}/login?error=auth`)
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, section, welcomed, active')
    .eq('id', user.id)
    .single()

  if (logSupabaseError('auth/callback: fetch profile', profileError, { userId: user.id, requestId })) {
    return NextResponse.redirect(`${origin}/login?error=auth`)
  }

  if (profile?.active === false) {
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/login?error=inactive`)
  }

  const dest = profile?.role === 'director' ? '/dashboard' : '/home'
  logInfo('auth/callback: redirecting after login', { userId: user.id, dest, requestId })

  // Crear el redirect final y aplicarle todas las cookies de sesión acumuladas
  const response = NextResponse.redirect(`${origin}${dest}`)
  cookieJar.forEach(({ name, value, options }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    response.cookies.set(name, value, options as any)
  })

  return response
}
