'use server'

import { createClient } from '@/lib/supabase/server'
import { logSupabaseError } from '@/lib/supabase/query-helpers'
import { revalidatePath } from 'next/cache'

export async function settleFine(formData: FormData) {
  const attendanceId = formData.get('attendanceId') as string
  if (!attendanceId) return

  const supabase = await createClient()
  const { error } = await supabase
    .from('attendances')
    .update({ fine_amount: 0 })
    .eq('id', attendanceId)

  logSupabaseError('fines: settleFine', error, { attendanceId })

  revalidatePath('/reportes', 'layout')
}
