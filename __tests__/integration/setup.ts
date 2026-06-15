import { createClient } from '@supabase/supabase-js'

// Standard local Supabase dev credentials — same for all local installations
const LOCAL_URL = 'http://127.0.0.1:54321'
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

export const db = createClient(LOCAL_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Event type IDs seeded by migration 001_schema.sql
export const EVENT_TYPES = {
  ensayo:       { id: 'e281e291-cea6-47d0-8609-9a15a3ddc0fd', fine_absent: 10000, fine_late: 5000 },
  presentacion: { id: 'a3bdd2cb-d341-43cf-afcd-a9624a5c0d35', fine_absent: 50000, fine_late: 25000 },
} as const

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
