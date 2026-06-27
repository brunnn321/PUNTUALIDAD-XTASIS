import { expect, test } from '@playwright/test'
import {
  createE2EUser,
  db,
  deleteE2EUsers,
  signInAs,
  uniqueEmail,
} from './fixtures'

const createdUsers: string[] = []

test.afterEach(async () => {
  const userIds = createdUsers.splice(0)
  await deleteE2EUsers(userIds)
})

// HU-09: director crea un nuevo miembro desde /miembros/nuevo
test('director creates a new member from /miembros/nuevo', async ({ page, context, baseURL }) => {
  const director = await createE2EUser({
    email: uniqueEmail('director-new-member'),
    fullName: 'Directora Miembros',
    role: 'director',
  })
  createdUsers.push(director.id)

  await signInAs(context, baseURL!, director.email)
  await page.goto('/miembros')

  await page.getByRole('link', { name: /Nuevo/i }).click()
  await expect(page).toHaveURL(/\/miembros\/nuevo$/)
  await expect(page.getByRole('heading', { name: /Nuevo miembro/i })).toBeVisible()

  const newEmail = uniqueEmail('created-member')
  await page.getByPlaceholder(/Juan Pérez/i).fill('Nuevo Miembro Test')
  await page.getByPlaceholder(/correo@gmail/i).fill(newEmail)
  await page.locator('select[name="section"]').selectOption('vientos')
  await page.getByPlaceholder(/Trompeta/i).fill('Clarinete')
  await page.getByRole('button', { name: /Agregar miembro/i }).click()

  // Debe volver a la lista de miembros y mostrar el nuevo miembro
  await expect(page).toHaveURL(/\/miembros$/)
  await expect(page.getByText('Nuevo Miembro Test')).toBeVisible()

  // Cleanup: obtener el id del perfil creado para borrarlo
  const { data } = await db.from('profiles').select('id').eq('full_name', 'Nuevo Miembro Test').single()
  if (data?.id) {
    // Solo eliminar el auth user si existe; el perfil se borra en cascada
    const { data: authUsers } = await db.auth.admin.listUsers()
    const authUser = authUsers.users.find(u => u.email === newEmail)
    if (authUser) createdUsers.push(authUser.id)
  }
})

// HU-11: director desactiva miembro(s) en modo selección
test('director deactivates a member using selection mode', async ({ page, context, baseURL }) => {
  const director = await createE2EUser({
    email: uniqueEmail('director-deactivate'),
    fullName: 'Directora Desactivar',
    role: 'director',
  })
  const member = await createE2EUser({
    email: uniqueEmail('member-to-deactivate'),
    fullName: 'Miembro A Desactivar',
    role: 'member',
    section: 'armonia',
  })
  createdUsers.push(director.id, member.id)

  await signInAs(context, baseURL!, director.email)
  await page.goto('/miembros')

  await expect(page.getByText('Miembro A Desactivar')).toBeVisible()

  // Entrar en modo selección
  await page.getByRole('button', { name: /Seleccionar/i }).click()

  // Seleccionar al miembro
  await page.getByRole('button').filter({ hasText: 'Miembro A Desactivar' }).click()

  // Confirmar que aparece el contador
  await expect(page.getByText(/1 miembro/i)).toBeVisible()

  // Desactivar
  await page.getByRole('button', { name: 'Desactivar', exact: true }).click()
  await page.waitForLoadState('networkidle')

  // El miembro debe aparecer en sección inactivos
  await expect(page.getByText('Inactivos', { exact: true })).toBeVisible()

  // Verificar en base de datos
  const { data } = await db.from('profiles').select('active').eq('id', member.id).single()
  expect(data?.active).toBe(false)
})

// HU-11: director reactiva un miembro inactivo
test('director reactivates an inactive member', async ({ page, context, baseURL }) => {
  const director = await createE2EUser({
    email: uniqueEmail('director-reactivate'),
    fullName: 'Directora Reactivar',
    role: 'director',
  })
  const member = await createE2EUser({
    email: uniqueEmail('member-to-reactivate'),
    fullName: 'Miembro Inactivo Reactivar',
    role: 'member',
    section: 'bailarines',
  })
  createdUsers.push(director.id, member.id)

  // Pre-desactivar en DB
  await db.from('profiles').update({ active: false }).eq('id', member.id)

  await signInAs(context, baseURL!, director.email)
  await page.goto('/miembros')

  // Sección inactivos debe ser visible
  await expect(page.getByText('Inactivos', { exact: true })).toBeVisible()
  await expect(page.getByText('Miembro Inactivo Reactivar')).toBeVisible()

  await page.getByRole('button', { name: /Seleccionar/i }).click()
  await page.getByRole('button').filter({ hasText: 'Miembro Inactivo Reactivar' }).click()

  await expect(page.getByText(/1 miembro/i)).toBeVisible()
  await page.getByRole('button', { name: 'Reactivar', exact: true }).click()
  await page.waitForLoadState('networkidle')

  // Verificar en base de datos
  const { data } = await db.from('profiles').select('active').eq('id', member.id).single()
  expect(data?.active).toBe(true)
})

// HU-10: director edita sección e instrumento de un miembro
test('director edits section and instrument of a member', async ({ page, context, baseURL }) => {
  const director = await createE2EUser({
    email: uniqueEmail('director-edit-member'),
    fullName: 'Directora Editar',
    role: 'director',
  })
  const member = await createE2EUser({
    email: uniqueEmail('member-to-edit'),
    fullName: 'Miembro Editable',
    role: 'member',
    section: 'vientos',
    instrument: 'Trompeta',
  })
  createdUsers.push(director.id, member.id)

  await signInAs(context, baseURL!, director.email)
  await page.goto('/miembros')

  await page.getByRole('link').filter({ hasText: 'Miembro Editable' }).click()
  await expect(page).toHaveURL(new RegExp(`/miembros/${member.id}`))

  // Ir a la página de edición
  await page.getByRole('link', { name: /Editar/i }).click()
  await expect(page).toHaveURL(new RegExp(`/miembros/${member.id}/editar`))

  await page.locator('select[name="section"]').selectOption('percusion')
  await page.locator('input[name="instrument"]').fill('Batería')
  await page.getByRole('button', { name: /Guardar/i }).click()

  await page.waitForLoadState('networkidle')

  // Verificar en base de datos
  const { data } = await db.from('profiles').select('section, instrument').eq('id', member.id).single()
  expect(data?.section).toBe('percusion')
  expect(data?.instrument).toBe('Batería')
})
