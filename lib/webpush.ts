import webpush from 'web-push'
import type { SupabaseClient } from '@supabase/supabase-js'
import { logError, logWarn } from '@/lib/logger'
import { logSupabaseError } from '@/lib/supabase/query-helpers'

let vapidConfigured = false

function ensureVapidConfigured() {
  if (vapidConfigured) return
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  )
  vapidConfigured = true
}

export type PushPayload = { title: string; body: string; url?: string }

async function sendOne(subscription: webpush.PushSubscription, payload: PushPayload, context: { tokenId: string }) {
  try {
    ensureVapidConfigured()
    await webpush.sendNotification(subscription, JSON.stringify(payload))
    return 'ok'
  } catch (err: any) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      logWarn('webpush: subscription expired', { tokenId: context.tokenId, statusCode: err.statusCode })
      return 'expired'
    }
    logError('webpush: send failed', { tokenId: context.tokenId, message: err.message, statusCode: err.statusCode })
    return 'error'
  }
}

export async function sendPushToUsers(
  supabase: SupabaseClient,
  userIds: string[],
  payload: PushPayload,
) {
  if (!userIds.length) return 0

  const { data: tokens, error: tokensError } = await supabase
    .from('push_tokens')
    .select('id, token')
    .in('user_id', userIds)

  if (logSupabaseError('webpush: fetch tokens', tokensError, { userCount: userIds.length })) return 0
  if (!tokens?.length) return 0

  const expiredIds: string[] = []
  let sent = 0

  await Promise.all(
    tokens.map(async (row) => {
      try {
        const sub = JSON.parse(row.token) as webpush.PushSubscription
        const result = await sendOne(sub, payload, { tokenId: row.id })
        if (result === 'expired') expiredIds.push(row.id)
        if (result === 'ok') sent++
      } catch (err) {
        logError('webpush: invalid token JSON', { tokenId: row.id, message: (err as Error).message })
        expiredIds.push(row.id)
      }
    })
  )

  if (expiredIds.length) {
    const { error: deleteError } = await supabase.from('push_tokens').delete().in('id', expiredIds)
    logSupabaseError('webpush: delete expired tokens', deleteError, { count: expiredIds.length })
  }

  return sent
}
