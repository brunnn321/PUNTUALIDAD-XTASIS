'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function getLeastFinesRanking(limit = 3) {
  const supabase = createAdminClient()

  const { data: members } = await supabase
    .from('profiles')
    .select('id, full_name, photo_url, section')
    .eq('role', 'member')
    .eq('active', true)

  const { data: attendances } = await supabase
    .from('attendances')
    .select('user_id, fine_amount')

  const totals = (members ?? []).map(m => ({
    ...m,
    fines: (attendances ?? [])
      .filter(a => a.user_id === m.id)
      .reduce((sum, a) => sum + a.fine_amount, 0),
  }))

  return totals
    .sort((a, b) => a.fines - b.fines)
    .slice(0, limit)
    .map(({ fines, ...rest }) => rest)
}
