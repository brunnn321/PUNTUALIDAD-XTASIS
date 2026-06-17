import { createClient } from '@/lib/supabase/server'
import { logSupabaseError } from '@/lib/supabase/query-helpers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? undefined
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()
  logSupabaseError('auth/logout: signOut', error, { requestId })
  return NextResponse.redirect(new URL('/login', request.url))
}
