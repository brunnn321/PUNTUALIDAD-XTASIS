import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { db, getEventTypes, type EventTypes, createTestUser, deleteTestUsers, createTestEvent, cleanupEvents } from './setup'

const EVENT_START = '2025-06-15T10:00:00Z'

let directorId: string
let memberId: string
let EVENT_TYPES: EventTypes

const createdEventIds: string[] = []

beforeAll(async () => {
  const ts = Date.now()
  directorId = await createTestUser(`dir-fines-${ts}@test.com`, 'director')
  memberId   = await createTestUser(`member-fines-${ts}@test.com`, 'member', 'vientos')
  EVENT_TYPES = await getEventTypes()
})

afterEach(async () => {
  const ids = createdEventIds.splice(0)
  await cleanupEvents(ids)
})

afterAll(async () => {
  await deleteTestUsers([directorId, memberId])
})

async function makeEvent(eventTypeId = EVENT_TYPES.ensayo.id) {
  const id = await createTestEvent({
    createdBy: directorId,
    eventTypeId,
    startsAt: EVENT_START,
  })
  createdEventIds.push(id)
  return id
}

async function insertAttendance(eventId: string, status: 'present' | 'late' | 'absent') {
  const { data, error } = await db
    .from('attendances')
    .insert({
      event_id: eventId,
      user_id: memberId,
      status,
      checked_in_at: status === 'absent' ? null : EVENT_START,
    })
    .select('fine_amount')
    .single()

  if (error) throw new Error(error.message)
  return Number(data.fine_amount)
}

async function getFineAmount(eventId: string) {
  const { data } = await db
    .from('attendances')
    .select('fine_amount')
    .eq('event_id', eventId)
    .eq('user_id', memberId)
    .single()
  return Number(data?.fine_amount ?? 0)
}

describe('calculate_fine trigger (Ensayo: absent=10000, late=5000)', () => {
  it('sets fine_amount to 0 for present status', async () => {
    const eventId = await makeEvent()
    const fine = await insertAttendance(eventId, 'present')
    expect(fine).toBe(0)
  })

  it('sets fine_amount to fine_late for late status', async () => {
    const eventId = await makeEvent()
    const fine = await insertAttendance(eventId, 'late')
    expect(fine).toBe(EVENT_TYPES.ensayo.fine_late)
  })

  it('sets fine_amount to fine_absent for absent status', async () => {
    const eventId = await makeEvent()
    const fine = await insertAttendance(eventId, 'absent')
    expect(fine).toBe(EVENT_TYPES.ensayo.fine_absent)
  })

  it('uses Presentación fine amounts correctly (absent=50000, late=25000)', async () => {
    const eventId = await makeEvent(EVENT_TYPES.presentacion.id)
    const fine = await insertAttendance(eventId, 'absent')
    expect(fine).toBe(EVENT_TYPES.presentacion.fine_absent)
  })

  it('recalculates fine when status is updated from absent to present', async () => {
    const eventId = await makeEvent()
    await insertAttendance(eventId, 'absent')
    expect(await getFineAmount(eventId)).toBe(EVENT_TYPES.ensayo.fine_absent)

    await db
      .from('attendances')
      .update({ status: 'present', checked_in_at: EVENT_START })
      .eq('event_id', eventId)
      .eq('user_id', memberId)

    expect(await getFineAmount(eventId)).toBe(0)
  })

  it('recalculates fine when status is updated from present to late', async () => {
    const eventId = await makeEvent()
    await insertAttendance(eventId, 'present')
    expect(await getFineAmount(eventId)).toBe(0)

    await db
      .from('attendances')
      .update({ status: 'late' })
      .eq('event_id', eventId)
      .eq('user_id', memberId)

    expect(await getFineAmount(eventId)).toBe(EVENT_TYPES.ensayo.fine_late)
  })

  it('close_event auto-absences carry the correct fine amount', async () => {
    const eventId = await makeEvent()
    await db.rpc('close_event', { p_event_id: eventId })

    const { data } = await db
      .from('attendances')
      .select('fine_amount')
      .eq('event_id', eventId)
      .eq('user_id', memberId)
      .single()

    expect(Number(data?.fine_amount)).toBe(EVENT_TYPES.ensayo.fine_absent)
  })
})
