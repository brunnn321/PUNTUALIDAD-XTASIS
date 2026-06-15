import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { createMember, updateMember, deleteMember, setMembersActive } from '@/lib/actions/members'

const mockRedirect = vi.mocked(redirect)
const mockCreateAdminClient = vi.mocked(createAdminClient)
const mockCreateClient = vi.mocked(createClient)

function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData()
  Object.entries(fields).forEach(([k, v]) => fd.set(k, v))
  return fd
}

describe('createMember', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when full_name is empty', async () => {
    const result = await createMember(null, makeFormData({
      full_name: '  ', email: 'test@example.com', section: 'vientos', instrument: '',
    }))
    expect(result).toEqual({ error: 'Nombre, correo y sección son obligatorios.' })
    expect(mockCreateAdminClient).not.toHaveBeenCalled()
  })

  it('returns error when email is empty', async () => {
    const result = await createMember(null, makeFormData({
      full_name: 'Carlos', email: '', section: 'vientos', instrument: '',
    }))
    expect(result).toEqual({ error: 'Nombre, correo y sección son obligatorios.' })
  })

  it('returns error when section is missing', async () => {
    const result = await createMember(null, makeFormData({
      full_name: 'Carlos', email: 'carlos@example.com', section: '', instrument: '',
    }))
    expect(result).toEqual({ error: 'Nombre, correo y sección son obligatorios.' })
  })

  it('returns error when email is already registered', async () => {
    mockCreateAdminClient.mockReturnValue({
      auth: {
        admin: {
          createUser: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Email has already been registered' },
          }),
        },
      },
    } as any)

    const result = await createMember(null, makeFormData({
      full_name: 'Carlos', email: 'existing@example.com', section: 'vientos', instrument: '',
    }))
    expect(result).toEqual({ error: 'Ya existe un miembro con ese correo.' })
  })

  it('returns the raw error message for other auth errors', async () => {
    mockCreateAdminClient.mockReturnValue({
      auth: {
        admin: {
          createUser: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Service temporarily unavailable' },
          }),
        },
      },
    } as any)

    const result = await createMember(null, makeFormData({
      full_name: 'Carlos', email: 'new@example.com', section: 'vientos', instrument: '',
    }))
    expect(result).toEqual({ error: 'Service temporarily unavailable' })
  })

  it('redirects to /miembros after successful creation', async () => {
    mockCreateAdminClient.mockReturnValue({
      auth: {
        admin: {
          createUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'new-user-id' } },
            error: null,
          }),
        },
      },
      from: vi.fn().mockReturnValue({
        upsert: vi.fn().mockResolvedValue({ error: null }),
      }),
    } as any)

    await createMember(null, makeFormData({
      full_name: 'Carlos', email: 'new@example.com', section: 'vientos', instrument: 'Trompeta',
    }))
    expect(mockRedirect).toHaveBeenCalledWith('/miembros')
  })

  it('stores null for instrument when empty', async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: null })
    mockCreateAdminClient.mockReturnValue({
      auth: {
        admin: {
          createUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'new-user-id' } },
            error: null,
          }),
        },
      },
      from: vi.fn().mockReturnValue({ upsert: upsertMock }),
    } as any)

    await createMember(null, makeFormData({
      full_name: 'Carlos', email: 'new@example.com', section: 'vientos', instrument: '',
    }))
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ instrument: null })
    )
  })
})

describe('deleteMember', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls auth.admin.deleteUser with the given id', async () => {
    const deleteUserMock = vi.fn().mockResolvedValue({ error: null })
    mockCreateAdminClient.mockReturnValue({
      auth: { admin: { deleteUser: deleteUserMock } },
    } as any)

    await deleteMember('user-123')
    expect(deleteUserMock).toHaveBeenCalledWith('user-123')
  })

  it('redirects to /miembros after deletion', async () => {
    mockCreateAdminClient.mockReturnValue({
      auth: { admin: { deleteUser: vi.fn().mockResolvedValue({ error: null }) } },
    } as any)

    await deleteMember('user-123')
    expect(mockRedirect).toHaveBeenCalledWith('/miembros')
  })
})

describe('setMembersActive', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function makeChain() {
    const inMock = vi.fn().mockResolvedValue({ error: null })
    const updateMock = vi.fn().mockReturnValue({ in: inMock })
    const fromMock = vi.fn().mockReturnValue({ update: updateMock })
    return { fromMock, updateMock, inMock }
  }

  it('sets active=false for the given ids', async () => {
    const { fromMock, updateMock, inMock } = makeChain()
    mockCreateClient.mockResolvedValue({ from: fromMock } as any)

    await setMembersActive(['id-1', 'id-2'], false)

    expect(fromMock).toHaveBeenCalledWith('profiles')
    expect(updateMock).toHaveBeenCalledWith({ active: false })
    expect(inMock).toHaveBeenCalledWith('id', ['id-1', 'id-2'])
  })

  it('sets active=true for the given ids', async () => {
    const { fromMock, updateMock, inMock } = makeChain()
    mockCreateClient.mockResolvedValue({ from: fromMock } as any)

    await setMembersActive(['id-3'], true)

    expect(updateMock).toHaveBeenCalledWith({ active: true })
    expect(inMock).toHaveBeenCalledWith('id', ['id-3'])
  })

  it('handles multiple ids correctly', async () => {
    const { fromMock, inMock } = makeChain()
    mockCreateClient.mockResolvedValue({ from: fromMock } as any)

    const ids = ['a', 'b', 'c', 'd']
    await setMembersActive(ids, false)

    expect(inMock).toHaveBeenCalledWith('id', ids)
  })

  it('does not throw with an empty array', async () => {
    const { fromMock } = makeChain()
    mockCreateClient.mockResolvedValue({ from: fromMock } as any)

    await expect(setMembersActive([], true)).resolves.not.toThrow()
  })
})

describe('updateMember', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when full_name is empty', async () => {
    const result = await updateMember(null, makeFormData({
      id: 'user-1', full_name: '', section: 'voces', instrument: '', active: 'true',
    }))
    expect(result).toEqual({ error: 'Nombre y sección son obligatorios.' })
    expect(mockCreateClient).not.toHaveBeenCalled()
  })

  it('returns error when section is empty', async () => {
    const result = await updateMember(null, makeFormData({
      id: 'user-1', full_name: 'María', section: '', instrument: '', active: 'true',
    }))
    expect(result).toEqual({ error: 'Nombre y sección son obligatorios.' })
  })

  it('redirects to member detail after successful update', async () => {
    const eqMock = vi.fn().mockResolvedValue({ error: null })
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock })
    mockCreateClient.mockResolvedValue({
      from: vi.fn().mockReturnValue({ update: updateMock }),
    } as any)

    await updateMember(null, makeFormData({
      id: 'user-1', full_name: 'María', section: 'voces', instrument: '', active: 'true',
    }))
    expect(mockRedirect).toHaveBeenCalledWith('/miembros/user-1')
  })

  it('stores null for instrument when empty', async () => {
    const eqMock = vi.fn().mockResolvedValue({ error: null })
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock })
    mockCreateClient.mockResolvedValue({
      from: vi.fn().mockReturnValue({ update: updateMock }),
    } as any)

    await updateMember(null, makeFormData({
      id: 'user-1', full_name: 'María', section: 'voces', instrument: '  ', active: 'true',
    }))
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ instrument: null })
    )
  })

  it('returns supabase error on update failure', async () => {
    const eqMock = vi.fn().mockResolvedValue({ error: { message: 'Row not found' } })
    mockCreateClient.mockResolvedValue({
      from: vi.fn().mockReturnValue({ update: vi.fn().mockReturnValue({ eq: eqMock }) }),
    } as any)

    const result = await updateMember(null, makeFormData({
      id: 'user-1', full_name: 'María', section: 'voces', instrument: '', active: 'true',
    }))
    expect(result).toEqual({ error: 'Row not found' })
  })
})
