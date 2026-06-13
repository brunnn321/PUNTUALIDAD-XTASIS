import webpush from 'web-push'
import type { SupabaseClient } from '@supabase/supabase-js'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

export type PushPayload = { title: string; body: string; url?: string }

async function sendOne(subscription: webpush.PushSubscription, payload: PushPayload) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload))
    return 'ok'
  } catch (err: any) {
    if (err.statusCode === 410 || err.statusCode === 404) return 'expired'
    console.error('Push error:', err.message)
    return 'error'
  }
}

export async function sendPushToUsers(
  supabase: SupabaseClient,
  userIds: string[],
  payload: PushPayload,
) {
  if (!userIds.length) return 0

  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('id, token')
    .in('user_id', userIds)

  if (!tokens?.length) return 0

  const expiredIds: string[] = []
  let sent = 0

  await Promise.all(
    tokens.map(async (row) => {
      try {
        const sub = JSON.parse(row.token) as webpush.PushSubscription
        const result = await sendOne(sub, payload)
        if (result === 'expired') expiredIds.push(row.id)
        if (result === 'ok') sent++
      } catch {
        expiredIds.push(row.id)
      }
    })
  )

  if (expiredIds.length) {
    await supabase.from('push_tokens').delete().in('id', expiredIds)
  }

  return sent
}
