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

// HU-31: kiosco sin evento activo muestra mensaje de espera
test('kiosk shows waiting message when no active event exists', async ({ page }) => {
  // No creamos ningún evento activo; la página raíz debe mostrar el mensaje vacío
  await page.goto('/')
  await expect(page.getByText('No hay check-in activo')).toBeVisible()
  await expect(page.getByText(/Vuelve cuando el director abra un evento/i)).toBeVisible()
})

// HU-31: kiosco con evento activo muestra lista de miembros elegibles
test('kiosk shows eligible members when event check-in window is open', async ({ page }) => {
  const director = await createE2EUser({
    email: uniqueEmail('director-kiosk-list'),
    fullName: 'Directora Kiosco Lista',
    role: 'director',
  })
  const member = await createE2EUser({
    email: uniqueEmail('member-kiosk-list'),
    fullName: 'Miembro Kiosco Lista',
    role: 'member',
    section: 'vientos',
  })
  createdUsers.push(director.id, member.id)

  // starts_at en 30 min, checkin_opens_at = ahora - 1 min (ventana activa)
  const eventId = await createE2EEvent({
    title: 'Ensayo Kiosco Lista',
    createdBy: director.id,
    startsAt: futureIso(30),
    checkinOpensAt: pastIso(1),
    status: 'open',
  })
  createdEvents.push(eventId)

  await page.goto('/')
  await expect(page.getByText('Marca tu asistencia')).toBeVisible()
  await expect(page.getByText('Ensayo Kiosco Lista')).toBeVisible()
  await expect(page.getByText('Miembro Kiosco Lista')).toBeVisible()
})

// HU-31: miembro hace check-in desde el kiosco con foto de galería
test('kiosk allows member to check in using gallery photo', async ({ page }) => {
  const director = await createE2EUser({
    email: uniqueEmail('director-kiosk-checkin'),
    fullName: 'Directora Kiosco Checkin',
    role: 'director',
  })
  const member = await createE2EUser({
    email: uniqueEmail('member-kiosk-checkin'),
    fullName: 'Miembro Kiosco Checkin',
    role: 'member',
    section: 'vientos',
  })
  createdUsers.push(director.id, member.id)

  const eventId = await createE2EEvent({
    title: 'Ensayo Kiosco Checkin',
    createdBy: director.id,
    startsAt: futureIso(30),
    checkinOpensAt: pastIso(1),
    status: 'open',
  })
  createdEvents.push(eventId)

  await page.goto('/')
  await expect(page.getByText('Miembro Kiosco Checkin')).toBeVisible()

  // Tocar el nombre del miembro
  await page.getByText('Miembro Kiosco Checkin').click()

  // La cámara se abre; usar galería
  await page.locator('input[type="file"]').setInputFiles({
    name: 'kiosk-checkin.png',
    mimeType: 'image/png',
    buffer: tinyPng,
  })

  // Esperar confirmación de éxito
  await expect(page.getByText(/Listo.*Miembro/i)).toBeVisible({ timeout: 10_000 })

  // Verificar en base de datos
  const { data } = await db
    .from('attendances')
    .select('status, photo_url')
    .eq('event_id', eventId)
    .eq('user_id', member.id)
    .single()
  expect(data?.status).toBe('present')
  expect(data?.photo_url).toBeTruthy()
})

// HU-31: miembro que ya marcó no aparece en la lista del kiosco
test('kiosk hides members who already checked in', async ({ page }) => {
  const director = await createE2EUser({
    email: uniqueEmail('director-kiosk-hide'),
    fullName: 'Directora Kiosco Ocultar',
    role: 'director',
  })
  const memberDone = await createE2EUser({
    email: uniqueEmail('member-kiosk-done'),
    fullName: 'Miembro Ya Marcó',
    role: 'member',
    section: 'vientos',
  })
  const memberPending = await createE2EUser({
    email: uniqueEmail('member-kiosk-pending'),
    fullName: 'Miembro Pendiente',
    role: 'member',
    section: 'vientos',
  })
  createdUsers.push(director.id, memberDone.id, memberPending.id)

  const eventId = await createE2EEvent({
    title: 'Ensayo Kiosco Ocultar',
    createdBy: director.id,
    startsAt: futureIso(30),
    checkinOpensAt: pastIso(1),
    status: 'open',
  })
  createdEvents.push(eventId)

  // El miembro "done" ya marcó su asistencia
  await addAttendance({ eventId, userId: memberDone.id, status: 'present', checkedInAt: pastIso(0) })

  await page.goto('/')
  await expect(page.getByText('Miembro Pendiente')).toBeVisible()
  await expect(page.getByText('Miembro Ya Marcó')).toHaveCount(0)
})

// HU-31: kiosco filtra miembros por sección del evento (target_sections)
test('kiosk only shows members matching event target sections', async ({ page }) => {
  const director = await createE2EUser({
    email: uniqueEmail('director-kiosk-section'),
    fullName: 'Directora Kiosco Sección',
    role: 'director',
  })
  const memberVientos = await createE2EUser({
    email: uniqueEmail('member-kiosk-vientos'),
    fullName: 'Miembro Vientos Kiosco',
    role: 'member',
    section: 'vientos',
  })
  const memberPercusion = await createE2EUser({
    email: uniqueEmail('member-kiosk-percusion'),
    fullName: 'Miembro Percusion Kiosco',
    role: 'member',
    section: 'percusion',
  })
  createdUsers.push(director.id, memberVientos.id, memberPercusion.id)

  // Evento solo para percusión
  const eventId = await createE2EEvent({
    title: 'Seccional Kiosco Percusion',
    createdBy: director.id,
    startsAt: futureIso(30),
    checkinOpensAt: pastIso(1),
    targetSections: ['percusion'],
    status: 'open',
  })
  createdEvents.push(eventId)

  await page.goto('/')
  await expect(page.getByText('Miembro Percusion Kiosco')).toBeVisible()
  await expect(page.getByText('Miembro Vientos Kiosco')).toHaveCount(0)
})

// HU-31: director autenticado es redirigido al dashboard, no al kiosco
test('authenticated director visiting / is redirected to dashboard', async ({ page, context, baseURL }) => {
  const director = await createE2EUser({
    email: uniqueEmail('director-kiosk-redirect'),
    fullName: 'Directora Redirect',
    role: 'director',
  })
  createdUsers.push(director.id)

  await signInAs(context, baseURL!, director.email)
  await page.goto('/')

  await expect(page).toHaveURL(/\/dashboard$/)
})
