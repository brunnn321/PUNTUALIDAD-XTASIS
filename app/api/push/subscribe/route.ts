import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const subscription = await request.json()

  await supabase
    .from('push_tokens')
    .upsert(
      { user_id: user.id, token: JSON.stringify(subscription) },
      { onConflict: 'token' }
    )

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { endpoint } = await request.json()

  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('id, token')
    .eq('user_id', user.id)

  const toDelete = tokens?.find((t) => {
    try { return JSON.parse(t.token).endpoint === endpoint } catch { return false }
  })

  if (toDelete) {
    await supabase.from('push_tokens').delete().eq('id', toDelete.id)
  }

  return NextResponse.json({ ok: true })
}
