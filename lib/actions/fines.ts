'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function settleFine(formData: FormData) {
  const attendanceId = formData.get('attendanceId') as string
  if (!attendanceId) return

  const supabase = await createClient()
  await supabase
    .from('attendances')
    .update({ fine_amount: 0 })
    .eq('id', attendanceId)

  revalidatePath('/reportes', 'layout')
}
