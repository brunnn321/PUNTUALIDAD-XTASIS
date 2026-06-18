import { expect, test } from '@playwright/test'
import {
  addAttendance,
  createE2EEvent,
  createE2EUser,
  db,
  deleteE2EEvents,
  deleteE2EUsers,
  EVENT_TYPES,
  futureIso,
  signInAs,
  tinyPng,
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

test('auth redirects unauthenticated users and routes each role to its home', async ({ page, context, baseURL }) => {
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('button', { name: /Continuar con Google/i })).toBeVisible()

  const director = await createE2EUser({
    email: uniqueEmail('director-auth'),
    fullName: 'Directora E2E',
    role: 'director',
  })
  const member = await createE2EUser({
    email: uniqueEmail('member-auth'),
    fullName: 'Miembro E2E',
    role: 'member',
    section: 'vientos',
    instrument: 'Trompeta',
  })
  createdUsers.push(director.id, member.id)

  await signInAs(context, baseURL!, director.email)
  await page.goto('/')
  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByRole('heading', { name: /Directora/i })).toBeVisible()

  await context.clearCookies()
  await signInAs(context, baseURL!, member.email)
  await page.goto('/')
  await expect(page).toHaveURL(/\/home$/)
  await expect(page.getByRole('heading', { name: /Miembro/i })).toBeVisible()

  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/home$/)
})

test('director sees dashboard summary and can open the next event detail', async ({ page, context, baseURL }) => {
  const director = await createE2EUser({
    email: uniqueEmail('director-dashboard'),
    fullName: 'Directora Dashboard',
    role: 'director',
  })
  const member = await createE2EUser({
    email: uniqueEmail('member-dashboard'),
    fullName: 'Carlos Dashboard',
    role: 'member',
    section: 'vientos',
    instrument: 'Saxofon',
  })
  createdUsers.push(director.id, member.id)

  const eventId = await createE2EEvent({
    title: 'Ensayo P0 Dashboard',
    createdBy: director.id,
    startsAt: futureIso(90),
    status: 'scheduled',
  })
  createdEvents.push(eventId)

  await addAttendance({
    eventId,
    userId: member.id,
    status: 'late',
    checkedInAt: futureIso(95),
  })

  await signInAs(context, baseURL!, director.email)
  await page.goto('/dashboard')

  await expect(page.getByText('Miembros activos')).toBeVisible()
  await expect(page.getByText('Multas pendientes')).toBeVisible()
  await expect(page.getByText('Próximo evento')).toBeVisible()
  await expect(page.getByText('Ensayo P0 Dashboard').first()).toBeVisible()

  await page.getByRole('link', { name: /Ver asistencia/i }).click()
  await expect(page).toHaveURL(new RegExp(`/eventos/${eventId}$`))
  await expect(page.getByRole('heading', { name: 'Ensayo P0 Dashboard' })).toBeVisible()
})

test('director creates a scheduled sectional event from the events form', async ({ page, context, baseURL }) => {
  page.on('console', (msg) => console.log('browser console', msg.type(), msg.text()))
  page.on('pageerror', (error) => console.log('page error', error.message))
  const director = await createE2EUser({
    email: uniqueEmail('director-create-event'),
    fullName: 'Directora Eventos',
    role: 'director',
  })
  createdUsers.push(director.id)

  await signInAs(context, baseURL!, director.email)
  await page.goto('/eventos')
  await page.getByRole('link', { name: 'Nuevo', exact: true }).click()
  await expect(page.getByRole('heading', { name: /Nuevo evento/i })).toBeVisible()
  await page.waitForLoadState('networkidle')
  await page.locator('form[data-hydrated="true"]').waitFor()

  const title = `Ensayo P0 Nuevo ${Date.now()}`
  const titleInput = page.getByPlaceholder(/Ensayo general/i)
  await titleInput.click()
  await titleInput.pressSequentially(title)
  await expect(titleInput).toHaveValue(title)
  await page.locator('select').selectOption({ label: 'Ensayo' })
  await page.locator('input[type="datetime-local"]').fill(toDatetimeLocal(futureIso(180)))
  await page.getByRole('button', { name: 'Vientos' }).click()
  await page.getByPlaceholder(/Información adicional/i).fill('Creado desde Playwright P0')
  await page.getByRole('button', { name: /Crear evento/i }).click()

  await expect(page).toHaveURL(/\/eventos$/)
  const newEventRow = page.getByRole('link', { name: title })
  await expect(newEventRow).toBeVisible()
  await expect(newEventRow.getByText('Programado')).toBeVisible()

  const { data } = await db.from('events').select('id').eq('title', title).single()
  if (data?.id) createdEvents.push(data.id)
})

test('director opens an event detail and closes it registering absences', async ({ page, context, baseURL }) => {
  const director = await createE2EUser({
    email: uniqueEmail('director-close-event'),
    fullName: 'Directora Cierre',
    role: 'director',
  })
  const member = await createE2EUser({
    email: uniqueEmail('member-close-event'),
    fullName: 'Miembro Ausente P0',
    role: 'member',
    section: 'vientos',
    instrument: 'Trombon',
  })
  createdUsers.push(director.id, member.id)

  const eventId = await createE2EEvent({
    title: 'Ensayo P0 Cierre',
    createdBy: director.id,
    startsAt: futureIso(30),
    targetSections: ['vientos'],
    status: 'open',
  })
  createdEvents.push(eventId)

  await signInAs(context, baseURL!, director.email)
  await page.goto(`/eventos/${eventId}`)
  await page.waitForLoadState('networkidle')
  await page.locator('[data-hydrated="true"]').first().waitFor()

  await expect(page.getByText('Miembro Ausente P0')).toBeVisible()
  await expect(page.getByText('Pendiente', { exact: true }).first()).toBeVisible()
  const closeButton = page.getByRole('button', { name: /Cerrar y registrar ausentes/i })
  await expect(closeButton).toBeEnabled()
  await closeButton.click()

  await expect(page.getByText('Evento cerrado')).toBeVisible({ timeout: 20000 })
  await expect(page.getByText('Falta').first()).toBeVisible()
  await expect(page.getByText(/Multas generadas/i)).toBeVisible()
})

test('member checks in to an open event using gallery photo', async ({ page, context, baseURL }) => {
  const director = await createE2EUser({
    email: uniqueEmail('director-checkin'),
    fullName: 'Directora Checkin',
    role: 'director',
  })
  const member = await createE2EUser({
    email: uniqueEmail('member-checkin'),
    fullName: 'Miembro Checkin',
    role: 'member',
    section: 'vientos',
    instrument: 'Trompeta',
  })
  createdUsers.push(director.id, member.id)

  const eventId = await createE2EEvent({
    title: 'Ensayo P0 Checkin',
    createdBy: director.id,
    startsAt: futureIso(30),
    targetSections: ['vientos'],
    status: 'open',
  })
  createdEvents.push(eventId)

  await signInAs(context, baseURL!, member.email)
  await page.goto('/home')
  await page.waitForLoadState('networkidle')
  await page.locator('[data-hydrated="true"]').first().waitFor()

  const checkinCard = page.locator('.bg-white').filter({ hasText: 'Ensayo P0 Checkin' }).first()
  await expect(checkinCard).toBeVisible()
  const galleryBtn = checkinCard.getByRole('button', { name: /Galería/i })
  await expect(galleryBtn).toBeVisible()

  // setInputFiles dispatches native change event which React 19 picks up via event delegation
  await checkinCard.locator('input[type="file"]').setInputFiles({
    name: 'checkin.png',
    mimeType: 'image/png',
    buffer: tinyPng,
  })

  await expect(page.getByText(/Usar esta foto/i)).toBeVisible()
  await page.getByRole('button', { name: /Confirmar/i }).click()

  await expect(page.getByText(/Asistencia registrada/i)).toBeVisible()
  await expect(checkinCard.getByRole('button', { name: /Galería/i })).toBeHidden()

  const { data } = await db
    .from('attendances')
    .select('status, photo_url')
    .eq('event_id', eventId)
    .eq('user_id', member.id)
    .single()
  expect(data?.status).toBe('present')
  expect(data?.photo_url).toBeTruthy()
})

test('member sees a sectional event as not applicable and cannot check in', async ({ page, context, baseURL }) => {
  const director = await createE2EUser({
    email: uniqueEmail('director-sectional'),
    fullName: 'Directora Seccional',
    role: 'director',
  })
  const member = await createE2EUser({
    email: uniqueEmail('member-sectional'),
    fullName: 'Miembro Vientos',
    role: 'member',
    section: 'vientos',
    instrument: 'Trompeta',
  })
  createdUsers.push(director.id, member.id)

  const eventId = await createE2EEvent({
    title: 'Seccional Solo Percusion P0',
    createdBy: director.id,
    startsAt: futureIso(30),
    eventTypeId: EVENT_TYPES.ensayo,
    targetSections: ['percusion'],
    status: 'open',
  })
  createdEvents.push(eventId)

  await signInAs(context, baseURL!, member.email)
  await page.goto('/home')

  const seccionalCard = page.locator('.bg-white').filter({ hasText: 'Seccional Solo Percusion P0' })
  await expect(seccionalCard).toBeVisible()
  await expect(seccionalCard.getByText('No aplica para tu sección')).toBeVisible()
  await expect(seccionalCard.getByRole('button', { name: /Galería/i })).toHaveCount(0)
  await expect(seccionalCard.getByRole('button', { name: /Cámara/i })).toHaveCount(0)
})

function toDatetimeLocal(iso: string) {
  const date = new Date(iso)
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}
