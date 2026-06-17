import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { db, getEventTypes, type EventTypes, createTestUser, deleteTestUsers, createTestEvent, cleanupEvents } from './setup'

// Fixed reference time — timezone independent
const EVENT_START = '2025-06-15T10:00:00Z'

let directorId: string
let EVENT_TYPES: EventTypes
const createdEventIds: string[] = []

beforeAll(async () => {
  directorId = await createTestUser(`dir-status-${Date.now()}@test.com`, 'director')
  EVENT_TYPES = await getEventTypes()
})

afterEach(async () => {
  const ids = createdEventIds.splice(0)
  await cleanupEvents(ids)
})

afterAll(async () => {
  await deleteTestUsers([directorId])
})

async function makeEvent() {
  const id = await createTestEvent({
    createdBy: directorId,
    eventTypeId: EVENT_TYPES.ensayo.id,
    startsAt: EVENT_START,
  })
  createdEventIds.push(id)
  return id
}

async function callRpc(eventId: string, checkedInAt: string) {
  const { data, error } = await db.rpc('resolve_attendance_status', {
    p_event_id: eventId,
    p_checked_in_at: checkedInAt,
  })
  if (error) throw new Error(error.message)
  return data as 'present' | 'late' | 'absent'
}

describe('resolve_attendance_status', () => {
  it('returns present when checking in exactly at start time', async () => {
    const id = await makeEvent()
    expect(await callRpc(id, '2025-06-15T10:00:00Z')).toBe('present')
  })

  it('returns present when checking in before start time (early arrival)', async () => {
    const id = await makeEvent()
    expect(await callRpc(id, '2025-06-15T09:50:00Z')).toBe('present')
  })

  it('returns present 1 second before start', async () => {
    const id = await makeEvent()
    expect(await callRpc(id, '2025-06-15T09:59:59Z')).toBe('present')
  })

  it('returns late at 1 minute after start', async () => {
    const id = await makeEvent()
    expect(await callRpc(id, '2025-06-15T10:01:00Z')).toBe('late')
  })

  it('returns late at exactly 15 minutes (boundary)', async () => {
    const id = await makeEvent()
    expect(await callRpc(id, '2025-06-15T10:15:00Z')).toBe('late')
  })

  it('returns absent at 16 minutes (one past the late boundary)', async () => {
    const id = await makeEvent()
    expect(await callRpc(id, '2025-06-15T10:16:00Z')).toBe('absent')
  })

  it('returns absent when very late (1 hour)', async () => {
    const id = await makeEvent()
    expect(await callRpc(id, '2025-06-15T11:00:00Z')).toBe('absent')
  })
})
