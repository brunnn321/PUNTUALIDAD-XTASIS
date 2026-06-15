import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { autoCloseExpiredEvents } from '@/lib/actions/events'

const mockCreateClient = vi.mocked(createClient)

function makeUpdateChain() {
  const chain: any = {}
  chain.update = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.lte = vi.fn(() => chain)
  chain.gte = vi.fn().mockResolvedValue({})
  return chain
}

function makeSelectChain(events: Array<{ id: string }>) {
  const chain: any = {}
  chain.select = vi.fn(() => chain)
  chain.neq = vi.fn(() => chain)
  chain.lt = vi.fn().mockResolvedValue({ data: events })
  return chain
}

describe('autoCloseExpiredEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not call rpc when there are no expired events', async () => {
    const rpcMock = vi.fn().mockResolvedValue({})
    mockCreateClient.mockResolvedValue({
      from: vi.fn()
        .mockReturnValueOnce(makeUpdateChain())
        .mockReturnValueOnce(makeSelectChain([])),
      rpc: rpcMock,
    } as any)

    await autoCloseExpiredEvents()
    expect(rpcMock).not.toHaveBeenCalled()
  })

  it('calls close_event rpc for each expired event', async () => {
    const rpcMock = vi.fn().mockResolvedValue({})
    mockCreateClient.mockResolvedValue({
      from: vi.fn()
        .mockReturnValueOnce(makeUpdateChain())
        .mockReturnValueOnce(makeSelectChain([{ id: 'event-1' }, { id: 'event-2' }])),
      rpc: rpcMock,
    } as any)

    await autoCloseExpiredEvents()
    expect(rpcMock).toHaveBeenCalledTimes(2)
    expect(rpcMock).toHaveBeenCalledWith('close_event', { p_event_id: 'event-1' })
    expect(rpcMock).toHaveBeenCalledWith('close_event', { p_event_id: 'event-2' })
  })

  it('calls close_event for a single expired event', async () => {
    const rpcMock = vi.fn().mockResolvedValue({})
    mockCreateClient.mockResolvedValue({
      from: vi.fn()
        .mockReturnValueOnce(makeUpdateChain())
        .mockReturnValueOnce(makeSelectChain([{ id: 'solo-event' }])),
      rpc: rpcMock,
    } as any)

    await autoCloseExpiredEvents()
    expect(rpcMock).toHaveBeenCalledOnce()
    expect(rpcMock).toHaveBeenCalledWith('close_event', { p_event_id: 'solo-event' })
  })

  it('attempts to open scheduled events before checking for expired ones', async () => {
    const updateChain = makeUpdateChain()
    const fromMock = vi.fn()
      .mockReturnValueOnce(updateChain)
      .mockReturnValueOnce(makeSelectChain([]))

    mockCreateClient.mockResolvedValue({ from: fromMock, rpc: vi.fn() } as any)

    await autoCloseExpiredEvents()

    // from() called twice: once for update (open scheduled), once for select (find expired)
    expect(fromMock).toHaveBeenCalledTimes(2)
    expect(updateChain.update).toHaveBeenCalledWith({ status: 'open' })
  })
})
