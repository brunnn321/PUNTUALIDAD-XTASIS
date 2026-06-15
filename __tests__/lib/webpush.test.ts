import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn(),
  },
}))

import webpush from 'web-push'
import { sendPushToUsers } from '@/lib/webpush'
import type { SupabaseClient } from '@supabase/supabase-js'

const mockSendNotification = vi.mocked(webpush.sendNotification)

const makeToken = (id: string) => ({
  id,
  token: JSON.stringify({
    endpoint: `https://push.example.com/${id}`,
    keys: { auth: 'auth-key', p256dh: 'p256dh-key' },
  }),
})

function makeSupabase(tokens: Array<{ id: string; token: string }>) {
  const deleteInMock = vi.fn().mockResolvedValue({ error: null })
  const selectInMock = vi.fn().mockResolvedValue({ data: tokens })

  return {
    client: {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({ in: selectInMock }),
        delete: vi.fn().mockReturnValue({ in: deleteInMock }),
      }),
    } as unknown as SupabaseClient,
    deleteInMock,
  }
}

describe('sendPushToUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 0 immediately when userIds is empty', async () => {
    const { client } = makeSupabase([])
    const result = await sendPushToUsers(client, [], { title: 'Test', body: 'Body' })
    expect(result).toBe(0)
    expect(client.from).not.toHaveBeenCalled()
  })

  it('returns 0 when no push tokens exist for the users', async () => {
    const { client } = makeSupabase([])
    const result = await sendPushToUsers(client, ['user-1'], { title: 'Test', body: 'Body' })
    expect(result).toBe(0)
  })

  it('counts successfully sent notifications', async () => {
    mockSendNotification.mockResolvedValue(undefined as any)
    const { client } = makeSupabase([makeToken('t1'), makeToken('t2')])

    const result = await sendPushToUsers(client, ['user-1'], { title: 'Test', body: 'Body' })
    expect(result).toBe(2)
  })

  it('marks 410 responses as expired and deletes those tokens', async () => {
    const expiredError = Object.assign(new Error('Gone'), { statusCode: 410 })
    mockSendNotification.mockRejectedValue(expiredError)
    const { client, deleteInMock } = makeSupabase([makeToken('t1'), makeToken('t2')])

    const result = await sendPushToUsers(client, ['user-1'], { title: 'Test', body: 'Body' })
    expect(result).toBe(0)
    expect(deleteInMock).toHaveBeenCalledWith('id', ['t1', 't2'])
  })

  it('marks 404 responses as expired', async () => {
    const expiredError = Object.assign(new Error('Not Found'), { statusCode: 404 })
    mockSendNotification.mockRejectedValue(expiredError)
    const { client, deleteInMock } = makeSupabase([makeToken('t1')])

    await sendPushToUsers(client, ['user-1'], { title: 'Test', body: 'Body' })
    expect(deleteInMock).toHaveBeenCalledWith('id', ['t1'])
  })

  it('does not delete tokens when all sends succeed', async () => {
    mockSendNotification.mockResolvedValue(undefined as any)
    const { client, deleteInMock } = makeSupabase([makeToken('t1')])

    await sendPushToUsers(client, ['user-1'], { title: 'Test', body: 'Body' })
    expect(deleteInMock).not.toHaveBeenCalled()
  })

  it('marks tokens with invalid JSON as expired and deletes them', async () => {
    const { client, deleteInMock } = makeSupabase([{ id: 'bad-token', token: 'not-valid-json' }])

    await sendPushToUsers(client, ['user-1'], { title: 'Test', body: 'Body' })
    expect(deleteInMock).toHaveBeenCalledWith('id', ['bad-token'])
  })

  it('handles mixed ok and expired results', async () => {
    const expiredError = Object.assign(new Error('Gone'), { statusCode: 410 })
    mockSendNotification
      .mockResolvedValueOnce(undefined as any)
      .mockRejectedValueOnce(expiredError)

    const { client, deleteInMock } = makeSupabase([makeToken('t1'), makeToken('t2')])
    const result = await sendPushToUsers(client, ['user-1'], { title: 'Test', body: 'Body' })

    expect(result).toBe(1)
    expect(deleteInMock).toHaveBeenCalledWith('id', ['t2'])
  })
})
