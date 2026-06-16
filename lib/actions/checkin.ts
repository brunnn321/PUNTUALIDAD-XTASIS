'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function registerKioskAttendance(eventId: string, userId: string, photoDataUrl: string) {
  const supabase = createAdminClient()

  const now = new Date().toISOString()
  const { data: statusResult } = await supabase.rpc('resolve_attendance_status', {
    p_event_id: eventId,
    p_checked_in_at: now,
  })

  let photoUrl: string | null = null
  const match = photoDataUrl.match(/^data:(image\/\w+);base64,(.+)$/)
  if (match) {
    const [, contentType, base64] = match
    const buffer = Buffer.from(base64, 'base64')
    const ext = contentType.split('/')[1] ?? 'jpg'
    const fileName = `${userId}/${eventId}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('attendance-photos')
      .upload(fileName, buffer, { contentType, upsert: true })

    if (!uploadError) {
      const { data } = supabase.storage.from('attendance-photos').getPublicUrl(fileName)
      photoUrl = data.publicUrl
    }
  }

  const { error } = await supabase.from('attendances').upsert(
    { event_id: eventId, user_id: userId, status: statusResult ?? 'present', checked_in_at: now, photo_url: photoUrl },
    { onConflict: 'event_id,user_id' }
  )

  if (error) return { error: error.message }
  return { success: true }
}
