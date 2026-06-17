import { createClient } from '@/lib/supabase/server'
import { logSupabaseError } from '@/lib/supabase/query-helpers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? undefined
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (logSupabaseError('push/subscribe POST: getUser', userError, { requestId }) || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const subscription = await request.json()

  const { error: upsertError } = await supabase
    .from('push_tokens')
    .upsert(
      { user_id: user.id, token: JSON.stringify(subscription) },
      { onConflict: 'token' }
    )

  if (logSupabaseError('push/subscribe POST: upsert token', upsertError, { userId: user.id, requestId })) {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? undefined
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (logSupabaseError('push/subscribe DELETE: getUser', userError, { requestId }) || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { endpoint } = await request.json()

  const { data: tokens, error: tokensError } = await supabase
    .from('push_tokens')
    .select('id, token')
    .eq('user_id', user.id)

  if (logSupabaseError('push/subscribe DELETE: fetch tokens', tokensError, { userId: user.id, requestId })) {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }

  const toDelete = tokens?.find((t) => {
    try { return JSON.parse(t.token).endpoint === endpoint } catch { return false }
  })

  if (toDelete) {
    const { error: deleteError } = await supabase.from('push_tokens').delete().eq('id', toDelete.id)
    logSupabaseError('push/subscribe DELETE: delete token', deleteError, { userId: user.id, tokenId: toDelete.id, requestId })
  }

  return NextResponse.json({ ok: true })
}
