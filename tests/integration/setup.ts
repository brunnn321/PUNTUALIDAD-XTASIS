import { createClient } from '@supabase/supabase-js'

// Standard local Supabase dev credentials — same for all local installations
const LOCAL_URL = 'http://127.0.0.1:54321'
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

export const db = createClient(LOCAL_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

export type EventTypeRow = { id: string; fine_absent: number; fine_late: number }
export type EventTypes = { ensayo: EventTypeRow; presentacion: EventTypeRow }

export async function getEventTypes(): Promise<EventTypes> {
  const { data, error } = await db
    .from('event_types')
    .select('id, name, fine_absent, fine_late')
    .in('name', ['Ensayo', 'Presentación'])

  if (error || !data?.length) throw new Error(`getEventTypes failed: ${error?.message}`)

  const byName = Object.fromEntries(data.map((r) => [r.name, r]))
  return {
    ensayo:       { id: byName['Ensayo'].id,        fine_absent: byName['Ensayo'].fine_absent,        fine_late: byName['Ensayo'].fine_late },
    presentacion: { id: byName['Presentación'].id,  fine_absent: byName['Presentación'].fine_absent,  fine_late: byName['Presentación'].fine_late },
  }
}

export type TestSection = 'vientos' | 'voces' | 'bailarines' | 'armonia' | 'percusion' | 'staff'

export async function createTestUser(
  email: string,
  role: 'director' | 'member',
  section?: TestSection,
): Promise<string> {
  const { data, error } = await db.auth.admin.createUser({
    email,
    password: 'test-password-123',
    email_confirm: true,
    user_metadata: { full_name: email.split('@')[0] },
  })
  if (error || !data.user) throw new Error(`createTestUser failed: ${error?.message}`)

  const { error: updateError } = await db
    .from('profiles')
    .update({ role, section: section ?? null, active: true })
    .eq('id', data.user.id)

  if (updateError) throw new Error(`profile update failed: ${updateError.message}`)
  return data.user.id
}

export async function deactivateUser(userId: string): Promise<void> {
  await db.from('profiles').update({ active: false }).eq('id', userId)
}

export async function deleteTestUsers(ids: string[]): Promise<void> {
  for (const id of ids) {
    await db.auth.admin.deleteUser(id)
  }
}

export async function createTestEvent(opts: {
  createdBy: string
  eventTypeId: string
  startsAt: string
  targetSections?: string[] | null
  status?: 'scheduled' | 'open' | 'closed'
}): Promise<string> {
  const { data, error } = await db
    .from('events')
    .insert({
      title: `Test Event ${Date.now()}`,
      event_type_id: opts.eventTypeId,
      starts_at: opts.startsAt,
      created_by: opts.createdBy,
      target_sections: opts.targetSections ?? null,
      status: opts.status ?? 'open',
    })
    .select('id')
    .single()

  if (error || !data) throw new Error(`createTestEvent failed: ${error?.message}`)
  return data.id as string
}

export async function cleanupEvents(eventIds: string[]): Promise<void> {
  if (!eventIds.length) return
  await db.from('events').delete().in('id', eventIds)
}
