import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import {
  db, EVENT_TYPES, createTestUser, deleteTestUsers, deactivateUser,
  createTestEvent, cleanupEvents, type TestSection,
} from './setup'

const EVENT_START = '2025-06-15T10:00:00Z'

let directorId: string
let vientos1Id: string
let vientos2Id: string
let vocesId: string
let percusionId: string
let inactiveMemberId: string

const createdEventIds: string[] = []
const createdUserIds: string[] = []

beforeAll(async () => {
  const ts = Date.now()
  const make = async (prefix: string, section: TestSection) => {
    const id = await createTestUser(`${prefix}-${ts}@test.com`, 'member', section)
    createdUserIds.push(id)
    return id
  }

  directorId = await createTestUser(`dir-close-${ts}@test.com`, 'director')
  createdUserIds.push(directorId)

  vientos1Id = await make('vientos1', 'vientos')
  vientos2Id = await make('vientos2', 'vientos')
  vocesId    = await make('voces1',   'voces')
  percusionId = await make('percusion1', 'percusion')

  inactiveMemberId = await make('inactive1', 'vientos')
  await deactivateUser(inactiveMemberId)
})

afterEach(async () => {
  const ids = createdEventIds.splice(0)
  await cleanupEvents(ids)
})

afterAll(async () => {
  await deleteTestUsers(createdUserIds)
})

async function makeEvent(targetSections: string[] | null = null) {
  const id = await createTestEvent({
    createdBy: directorId,
    eventTypeId: EVENT_TYPES.ensayo.id,
    startsAt: EVENT_START,
    targetSections,
  })
  createdEventIds.push(id)
  return id
}

async function checkIn(eventId: string, userId: string) {
  await db.from('attendances').insert({
    event_id: eventId,
    user_id: userId,
    status: 'present',
    checked_in_at: EVENT_START,
  })
}

async function getAbsences(eventId: string) {
  const { data } = await db
    .from('attendances')
    .select('user_id')
    .eq('event_id', eventId)
    .eq('status', 'absent')
  return (data ?? []).map((r: any) => r.user_id as string)
}

async function getEventStatus(eventId: string) {
  const { data } = await db.from('events').select('status').eq('id', eventId).single()
  return data?.status as string
}

describe('close_event', () => {
  it('marks all applicable members absent when no one checked in (target_sections = NULL)', async () => {
    const eventId = await makeEvent(null)
    await db.rpc('close_event', { p_event_id: eventId })

    const absentIds = await getAbsences(eventId)

    expect(absentIds).toContain(vientos1Id)
    expect(absentIds).toContain(vientos2Id)
    expect(absentIds).toContain(vocesId)
    expect(absentIds).toContain(percusionId)
  })

  it('sets event status to closed', async () => {
    const eventId = await makeEvent(null)
    expect(await getEventStatus(eventId)).toBe('open')

    await db.rpc('close_event', { p_event_id: eventId })

    expect(await getEventStatus(eventId)).toBe('closed')
  })

  it('does not mark inactive members absent', async () => {
    const eventId = await makeEvent(null)
    await db.rpc('close_event', { p_event_id: eventId })

    const absentIds = await getAbsences(eventId)
    expect(absentIds).not.toContain(inactiveMemberId)
  })

  it('does not mark directors absent', async () => {
    const eventId = await makeEvent(null)
    await db.rpc('close_event', { p_event_id: eventId })

    const absentIds = await getAbsences(eventId)
    expect(absentIds).not.toContain(directorId)
  })

  it('does not overwrite attendance for members who already checked in', async () => {
    const eventId = await makeEvent(null)
    await checkIn(eventId, vientos1Id)

    await db.rpc('close_event', { p_event_id: eventId })

    const absentIds = await getAbsences(eventId)
    expect(absentIds).not.toContain(vientos1Id)
    expect(absentIds).toContain(vientos2Id)
  })

  it('only marks members from target_sections absent', async () => {
    const eventId = await makeEvent(['vientos'])
    await db.rpc('close_event', { p_event_id: eventId })

    const absentIds = await getAbsences(eventId)

    expect(absentIds).toContain(vientos1Id)
    expect(absentIds).toContain(vientos2Id)
    expect(absentIds).not.toContain(vocesId)
    expect(absentIds).not.toContain(percusionId)
  })

  it('handles multiple target sections', async () => {
    const eventId = await makeEvent(['vientos', 'voces'])
    await db.rpc('close_event', { p_event_id: eventId })

    const absentIds = await getAbsences(eventId)

    expect(absentIds).toContain(vientos1Id)
    expect(absentIds).toContain(vocesId)
    expect(absentIds).not.toContain(percusionId)
  })

  it('does not mark a member absent when they already checked in', async () => {
    const eventId = await makeEvent(['vientos'])
    await checkIn(eventId, vientos1Id)
    await checkIn(eventId, vientos2Id)

    await db.rpc('close_event', { p_event_id: eventId })

    const absentIds = await getAbsences(eventId)
    expect(absentIds).not.toContain(vientos1Id)
    expect(absentIds).not.toContain(vientos2Id)
  })
})
