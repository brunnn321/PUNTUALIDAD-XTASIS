import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import type { BrowserContext } from '@playwright/test'

export const LOCAL_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321'
export const LOCAL_SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDYxNzkyMDAsImV4cCI6MTk2MTc1NTIwMH0.7rR9-MxaGgKUNWrpEPtN1TUrL6sN8G4OAI_jiv9KDTQ'
export const LOCAL_SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

export const TEST_PASSWORD = 'test-password-123'

export const db = createClient(LOCAL_SUPABASE_URL, LOCAL_SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

export const EVENT_TYPES = {
  ensayo: 'e281e291-cea6-47d0-8609-9a15a3ddc0fd',
  presentacion: 'a3bdd2cb-d341-43cf-afcd-a9624a5c0d35',
} as const

type Role = 'director' | 'member'
type Section = 'vientos' | 'voces' | 'bailarines' | 'armonia' | 'percusion' | 'staff'

export async function createE2EUser(opts: {
  email: string
  fullName: string
  role: Role
  section?: Section
  instrument?: string
}) {
  const { data, error } = await db.auth.admin.createUser({
    email: opts.email,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: opts.fullName },
  })
  if (error || !data.user) throw new Error(`createE2EUser failed: ${error?.message}`)

  const { error: profileError } = await db
    .from('profiles')
    .update({
      full_name: opts.fullName,
      role: opts.role,
      section: opts.section ?? null,
      instrument: opts.instrument ?? null,
      active: true,
    })
    .eq('id', data.user.id)

  if (profileError) throw new Error(`profile update failed: ${profileError.message}`)

  return { id: data.user.id, email: opts.email }
}

export async function deleteE2EUsers(ids: string[]) {
  for (const id of ids) {
    await db.auth.admin.deleteUser(id)
  }
}

export async function createE2EEvent(opts: {
  title: string
  createdBy: string
  startsAt: string
  eventTypeId?: string
  targetSections?: Section[] | null
  status?: 'scheduled' | 'open' | 'closed'
  notes?: string
}) {
  const { data, error } = await db
    .from('events')
    .insert({
      title: opts.title,
      event_type_id: opts.eventTypeId ?? EVENT_TYPES.ensayo,
      starts_at: opts.startsAt,
      created_by: opts.createdBy,
      target_sections: opts.targetSections ?? null,
      status: opts.status ?? 'scheduled',
      notes: opts.notes ?? null,
    })
    .select('id')
    .single()

  if (error || !data) throw new Error(`createE2EEvent failed: ${error?.message}`)
  return data.id as string
}

export async function deleteE2EEvents(ids: string[]) {
  if (!ids.length) return
  await db.from('events').delete().in('id', ids)
}

export async function addAttendance(opts: {
  eventId: string
  userId: string
  status: 'present' | 'late' | 'absent'
  checkedInAt?: string | null
  photoUrl?: string | null
}) {
  const attendance: Record<string, string | null> = {
    event_id: opts.eventId,
    user_id: opts.userId,
    status: opts.status,
    checked_in_at: opts.checkedInAt ?? null,
  }
  if (opts.photoUrl !== undefined) {
    attendance.photo_url = opts.photoUrl
  }

  const { error } = await db.from('attendances').insert(attendance)
  if (error) throw new Error(`addAttendance failed: ${error.message}`)
}

export async function signInAs(context: BrowserContext, baseURL: string, email: string) {
  const appURL = baseURL || 'http://127.0.0.1:3000'
  const cookiesToSet: Array<{ name: string; value: string; options: any }> = []
  const supabase = createServerClient(LOCAL_SUPABASE_URL, LOCAL_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => [],
      setAll: (cookies) => {
        cookiesToSet.push(...cookies)
      },
    },
  })

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: TEST_PASSWORD,
  })
  if (error) throw new Error(`signInAs failed: ${error.message}`)

  await context.addCookies(
    cookiesToSet.map(({ name, value, options }) => ({
      name,
      value,
      url: appURL,
      httpOnly: false,
      secure: Boolean(options?.secure),
      sameSite: normalizeSameSite(options?.sameSite),
      expires: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
    })),
  )
}

function normalizeSameSite(value: string | undefined): 'Strict' | 'Lax' | 'None' | undefined {
  if (!value) return 'Lax'
  const normalized = value.toLowerCase()
  if (normalized === 'strict') return 'Strict'
  if (normalized === 'none') return 'None'
  return 'Lax'
}

export function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@e2e.test`
}

export function futureIso(minutesFromNow: number) {
  return new Date(Date.now() + minutesFromNow * 60_000).toISOString()
}

export function pastIso(minutesAgo: number) {
  return new Date(Date.now() - minutesAgo * 60_000).toISOString()
}

export const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/l6i3yQAAAABJRU5ErkJggg==',
  'base64',
)
