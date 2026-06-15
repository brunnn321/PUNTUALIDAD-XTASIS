import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

vi.mock('@/lib/webpush', () => ({
  sendPushToUsers: vi.fn().mockResolvedValue(0),
}))

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { GET } from '@/app/api/cron/close-events/route'

const mockCreateClient = vi.mocked(createClient)
const mockCreateAdminClient = vi.mocked(createAdminClient)

function makeRequest(authHeader?: string) {
  return new Request('http://localhost/api/cron/close-events', {
    headers: authHeader ? { authorization: authHeader } : {},
  })
}

function makeOpenEventsChain(events: any[]) {
  const chain: any = {}
  ;['update', 'eq', 'neq', 'lte', 'gte', 'lt'].forEach(m => { chain[m] = vi.fn(() => chain) })
  chain.select = vi.fn().mockResolvedValue({ data: events })
  return chain
}

function makeSelectChain(events: any[]) {
  const chain: any = {}
  chain.select = vi.fn(() => chain)
  chain.neq = vi.fn(() => chain)
  chain.lt = vi.fn().mockResolvedValue({ data: events })
  return chain
}

function makeAdminChain(members: any[]) {
  const chain: any = {}
  ;['select', 'eq', 'in', 'update'].forEach(m => { chain[m] = vi.fn(() => chain) })
  chain._resolve = { data: members }
  chain.then = (r: any) => Promise.resolve(chain._resolve).then(r)
  return chain
}

describe('GET /api/cron/close-events', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when Authorization header is missing', async () => {
    const res = await GET(makeRequest())
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body).toEqual({ error: 'Unauthorized' })
  })

  it('returns 401 when Bearer token is wrong', async () => {
    const res = await GET(makeRequest('Bearer wrong-secret'))
    expect(res.status).toBe(401)
  })

  it('accepts the correct CRON_SECRET', async () => {
    mockCreateClient.mockResolvedValue({
      from: vi.fn()
        .mockReturnValueOnce(makeOpenEventsChain([]))
        .mockReturnValueOnce(makeSelectChain([])),
      rpc: vi.fn().mockResolvedValue({}),
    } as any)
    mockCreateAdminClient.mockReturnValue({} as any)

    const res = await GET(makeRequest('Bearer test-cron-secret'))
    expect(res.status).toBe(200)
  })

  it('returns { opened, closed } in the response body', async () => {
    mockCreateClient.mockResolvedValue({
      from: vi.fn()
        .mockReturnValueOnce(makeOpenEventsChain([]))
        .mockReturnValueOnce(makeSelectChain([])),
      rpc: vi.fn().mockResolvedValue({}),
    } as any)
    mockCreateAdminClient.mockReturnValue({} as any)

    const res = await GET(makeRequest('Bearer test-cron-secret'))
    const body = await res.json()
    expect(body).toMatchObject({ opened: 0, closed: 0 })
  })

  it('calls close_event rpc for each expired event', async () => {
    const rpcMock = vi.fn().mockResolvedValue({})
    mockCreateClient.mockResolvedValue({
      from: vi.fn()
        .mockReturnValueOnce(makeOpenEventsChain([]))
        .mockReturnValueOnce(makeSelectChain([
          { id: 'evt-1', title: 'Ensayo General' },
          { id: 'evt-2', title: 'Práctica Seccional' },
        ])),
      rpc: rpcMock,
    } as any)
    mockCreateAdminClient.mockReturnValue({} as any)

    const res = await GET(makeRequest('Bearer test-cron-secret'))
    expect(rpcMock).toHaveBeenCalledTimes(2)
    expect(rpcMock).toHaveBeenCalledWith('close_event', { p_event_id: 'evt-1' })
    expect(rpcMock).toHaveBeenCalledWith('close_event', { p_event_id: 'evt-2' })

    const body = await res.json()
    expect(body.closed).toBe(2)
  })
})
