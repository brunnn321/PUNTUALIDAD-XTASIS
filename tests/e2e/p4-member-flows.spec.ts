import { expect, test } from '@playwright/test'
import {
  addAttendance,
  createE2EEvent,
  createE2EUser,
  db,
  deleteE2EEvents,
  deleteE2EUsers,
  futureIso,
  pastIso,
  signInAs,
  uniqueEmail,
} from './fixtures'

const createdUsers: string[] = []
const createdEvents: string[] = []

test.afterEach(async () => {
  const eventIds = createdEvents.splice(0)
  await deleteE2EEvents(eventIds)
  const userIds = createdUsers.splice(0)
  await deleteE2EUsers(userIds)
})

// HU-21: miembro ve historial de eventos propios (próximos y pasados)
test('member sees upcoming and past events on /mis-eventos', async ({ page, context, baseURL }) => {
  const director = await createE2EUser({
    email: uniqueEmail('director-mis-eventos'),
    fullName: 'Directora MisEventos',
    role: 'director',
  })
  const member = await createE2EUser({
    email: uniqueEmail('member-mis-eventos'),
    fullName: 'Miembro MisEventos',
    role: 'member',
    section: 'vientos',
  })
  createdUsers.push(director.id, member.id)

  const futureEventId = await createE2EEvent({
    title: 'Ensayo Próximo MisEventos',
    createdBy: director.id,
    startsAt: futureIso(120),
    status: 'scheduled',
  })
  const pastEventId = await createE2EEvent({
    title: 'Ensayo Pasado MisEventos',
    createdBy: director.id,
    startsAt: pastIso(120),
    status: 'closed',
  })
  createdEvents.push(futureEventId, pastEventId)

  await addAttendance({ eventId: pastEventId, userId: member.id, status: 'present', checkedInAt: pastIso(125) })

  await signInAs(context, baseURL!, member.email)
  await page.goto('/mis-eventos')

  await expect(page.getByRole('heading', { name: /Mis eventos/i })).toBeVisible()
  // El resumen de asistencia aparece en ambas vistas
  await expect(page.getByText(/Asistencia/i).first()).toBeVisible()
  // Cambiar a vista Lista para ver los títulos de eventos
  await page.getByRole('button', { name: /Lista/i }).click()
  await expect(page.getByText('Ensayo Próximo MisEventos')).toBeVisible()
  await expect(page.getByText('Ensayo Pasado MisEventos')).toBeVisible()
})

// HU-21: miembro puede cambiar a vista de calendario
test('member toggles to calendar view on /mis-eventos', async ({ page, context, baseURL }) => {
  const director = await createE2EUser({
    email: uniqueEmail('director-calendar-member'),
    fullName: 'Directora Cal Miembro',
    role: 'director',
  })
  const member = await createE2EUser({
    email: uniqueEmail('member-calendar'),
    fullName: 'Miembro Calendario',
    role: 'member',
    section: 'armonia',
  })
  createdUsers.push(director.id, member.id)

  await signInAs(context, baseURL!, member.email)
  await page.goto('/mis-eventos')

  // Toggle a vista calendario
  await page.getByRole('button', { name: /Calendario/i }).click()
  // El grid del calendario debe aparecer (días del mes visibles)
  await expect(page.locator('.grid.grid-cols-7').last()).toBeVisible()
})

// HU-22: miembro ve total de multas acumuladas en /mis-multas
test('member sees total fines on /mis-multas', async ({ page, context, baseURL }) => {
  const director = await createE2EUser({
    email: uniqueEmail('director-mis-multas'),
    fullName: 'Directora MisMultas',
    role: 'director',
  })
  const member = await createE2EUser({
    email: uniqueEmail('member-mis-multas'),
    fullName: 'Miembro MisMultas',
    role: 'member',
    section: 'voces',
  })
  createdUsers.push(director.id, member.id)

  const eventId = await createE2EEvent({
    title: 'Ensayo Multas Miembro',
    createdBy: director.id,
    startsAt: pastIso(180),
    status: 'closed',
  })
  createdEvents.push(eventId)

  // No insertar fine_amount — el trigger lo calcula (Ensayo late = 5.000)
  await db.from('attendances').insert({
    event_id: eventId,
    user_id: member.id,
    status: 'late',
    checked_in_at: pastIso(170),
  })

  await signInAs(context, baseURL!, member.email)
  await page.goto('/mis-multas')

  await expect(page.getByRole('heading', { name: /Mis multas/i })).toBeVisible()
  await expect(page.getByText(/Total acumulado/i)).toBeVisible()
  // El monto total debe ser mayor que 0 (el trigger calcula fine_late del tipo Ensayo)
  await expect(page.getByText(/Bs\s*\d/i).first()).toBeVisible()
  // El evento desglosado
  await expect(page.getByText('Ensayo Multas Miembro')).toBeVisible()
})

// HU-22: miembro sin multas ve mensaje positivo
test('member with no fines sees zero total and positive message on /mis-multas', async ({ page, context, baseURL }) => {
  const director = await createE2EUser({
    email: uniqueEmail('director-sin-multas'),
    fullName: 'Directora Sin Multas',
    role: 'director',
  })
  const member = await createE2EUser({
    email: uniqueEmail('member-sin-multas'),
    fullName: 'Miembro Sin Multas',
    role: 'member',
    section: 'bailarines',
  })
  createdUsers.push(director.id, member.id)

  await signInAs(context, baseURL!, member.email)
  await page.goto('/mis-multas')

  await expect(page.getByText(/Bs\s*0/i)).toBeVisible()
  await expect(page.getByText(/Sin multas/i)).toBeVisible()
})

// HU-23: miembro edita su nombre (primera vez, queda bloqueado después)
test('member can edit name once and field locks after saving', async ({ page, context, baseURL }) => {
  const member = await createE2EUser({
    email: uniqueEmail('member-edit-name'),
    fullName: 'Nombre Original',
    role: 'member',
    section: 'vientos',
  })
  createdUsers.push(member.id)

  // Asegurar que name_edited es false
  await db.from('profiles').update({ name_edited: false }).eq('id', member.id)

  await signInAs(context, baseURL!, member.email)
  await page.goto('/perfil')

  // El campo debe ser editable
  const nameInput = page.locator('input[type="text"]').first()
  await expect(nameInput).toBeEnabled()
  await nameInput.fill('Nombre Cambiado')
  await page.getByRole('button', { name: /Guardar/i }).click()
  await page.waitForLoadState('networkidle')

  // Recargar para ver el estado bloqueado
  await page.reload()
  await expect(page.getByText('Ya usaste tu cambio de nombre')).toBeVisible()
  // El input ya no debe existir como campo editable
  await expect(page.locator('input[type="text"]').first()).toHaveCount(0)
})
