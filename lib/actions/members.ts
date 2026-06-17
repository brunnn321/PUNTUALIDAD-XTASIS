'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { logSupabaseError } from '@/lib/supabase/query-helpers'
import { redirect } from 'next/navigation'

export async function createMember(_: unknown, formData: FormData) {
  const full_name = (formData.get('full_name') as string).trim()
  const email = (formData.get('email') as string).trim().toLowerCase()
  const section = formData.get('section') as string
  const instrument = (formData.get('instrument') as string).trim()

  if (!full_name || !email || !section) {
    return { error: 'Nombre, correo y sección son obligatorios.' }
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name },
  })

  if (error) {
    if (error.message.includes('already been registered')) {
      return { error: 'Ya existe un miembro con ese correo.' }
    }
    logSupabaseError('members: createMember createUser', error)
    return { error: error.message }
  }

  const { error: upsertError } = await supabase
    .from('profiles')
    .upsert({
      id: data.user.id,
      full_name,
      section,
      instrument: instrument || null,
      role: 'member',
      active: true,
      welcomed: false,
    })

  logSupabaseError('members: createMember upsert profile', upsertError, { userId: data.user.id })

  redirect('/miembros')
}

export async function deleteMember(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.auth.admin.deleteUser(id)
  logSupabaseError('members: deleteMember', error, { userId: id })
  redirect('/miembros')
}

// Eliminar múltiples miembros desde selección en lista (sin redirect, para usar en loop)
export async function deleteMembersByIds(ids: string[]) {
  const supabase = createAdminClient()
  for (const id of ids) {
    const { error } = await supabase.auth.admin.deleteUser(id)
    logSupabaseError('members: deleteMembersByIds', error, { userId: id })
  }
}

// Activar o desactivar múltiples miembros desde selección en lista
export async function setMembersActive(ids: string[], active: boolean) {
  const supabase = await createClient()
  const { error } = await supabase.from('profiles').update({ active }).in('id', ids)
  logSupabaseError('members: setMembersActive', error, { count: ids.length, active })
}

export async function updateMember(_: unknown, formData: FormData) {
  const id = formData.get('id') as string
  const full_name = (formData.get('full_name') as string).trim()
  const section = formData.get('section') as string
  const instrument = (formData.get('instrument') as string).trim()
  const active = formData.get('active') === 'true'

  if (!full_name || !section) {
    return { error: 'Nombre y sección son obligatorios.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name,
      section,
      instrument: instrument || null,
      active,
    })
    .eq('id', id)

  if (logSupabaseError('members: updateMember', error, { userId: id })) {
    return { error: error!.message }
  }

  redirect(`/miembros/${id}`)
}
