import { createClient } from '@/lib/supabase/server'
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

  const supabase = await createClient()
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

  const dest = profile?.role === 'director' ? '/dashboard' : '/'
  logInfo('auth/callback: redirecting after login', { userId: user.id, dest, requestId })
  return NextResponse.redirect(`${origin}${dest}`)
}
