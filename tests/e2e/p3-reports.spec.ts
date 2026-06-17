import { expect, test } from '@playwright/test'
import {
  createE2EEvent,
  createE2EUser,
  db,
  deleteE2EEvents,
  deleteE2EUsers,
  EVENT_TYPES,
  getRealDirector,
  pastIso,
  signInAs,
  uniqueEmail,
} from './fixtures'

// ─── Shared fixtures ────────────────────────────────────────────────────────

let directorId: string
let directorEmail: string
let member1Id: string
let member2Id: string
let member3Id: string
let eventPresentId: string
let eventLateId: string
let eventAbsentId: string

const allUserIds: string[] = []
const allEventIds: string[] = []

test.beforeAll(async () => {
  // Usar el director real del sistema — los directores E2E no pasan is_director()
  // en queries SSR con join a profiles (limitación de RLS con tokens no-OAuth en Supabase local).
  const director = await getRealDirector()
  directorId = director.id
  directorEmail = director.email
  // No agregar a allUserIds — el director real no se elimina

  // Miembros
  const m1 = await createE2EUser({
    email: uniqueEmail('member-p3-presente'),
    fullName: 'Ana Puntual',
    role: 'member',
    section: 'vientos',
    instrument: 'Trompeta',
  })
  const m2 = await createE2EUser({
    email: uniqueEmail('member-p3-tarde'),
    fullName: 'Carlos Tardón',
    role: 'member',
    section: 'voces',
    instrument: 'Voz',
  })
  const m3 = await createE2EUser({
    email: uniqueEmail('member-p3-ausente'),
    fullName: 'Pedro Ausente',
    role: 'member',
    section: 'percusion',
    instrument: 'Batería',
  })
  member1Id = m1.id
  member2Id = m2.id
  member3Id = m3.id
  allUserIds.push(member1Id, member2Id, member3Id)

  // Evento 1: Ana presente (sin multa)
  eventPresentId = await createE2EEvent({
    title: 'Ensayo Asistencia Perfecta',
    createdBy: directorId,
    startsAt: pastIso(120),
    eventTypeId: EVENT_TYPES.ensayo,
    status: 'closed',
  })
  allEventIds.push(eventPresentId)
  await db.from('attendances').insert({
    event_id: eventPresentId,
    user_id: member1Id,
    status: 'present',
    checked_in_at: pastIso(125),
  })

  // Evento 2: Carlos tardanza (fine_late = 5000 para Ensayo)
  eventLateId = await createE2EEvent({
    title: 'Ensayo Con Tardanza',
    createdBy: directorId,
    startsAt: pastIso(90),
    eventTypeId: EVENT_TYPES.ensayo,
    status: 'closed',
  })
  allEventIds.push(eventLateId)
  await db.from('attendances').insert({
    event_id: eventLateId,
    user_id: member2Id,
    status: 'late',
    checked_in_at: pastIso(80),
  })

  // Evento 3: Pedro ausente (fine_absent = 10000 para Ensayo)
  eventAbsentId = await createE2EEvent({
    title: 'Ensayo Con Ausente',
    createdBy: directorId,
    startsAt: pastIso(60),
    eventTypeId: EVENT_TYPES.ensayo,
    status: 'closed',
  })
  allEventIds.push(eventAbsentId)
  await db.from('attendances').insert({
    event_id: eventAbsentId,
    user_id: member3Id,
    status: 'absent',
    checked_in_at: null,
  })
})

test.afterAll(async () => {
  await deleteE2EEvents(allEventIds)
  await deleteE2EUsers(allUserIds)
})

// ─── Tests ──────────────────────────────────────────────────────────────────

// HU-13: director ve ranking de asistencia con podio en /reportes
test('director sees attendance ranking with podium on /reportes', async ({ page, context, baseURL }) => {
  await signInAs(context, baseURL!, directorEmail)
  await page.goto('/reportes')

  await expect(page.getByRole('heading', { name: /Reportes/i })).toBeVisible()
  await expect(page.getByText('Ranking de asistencia')).toBeVisible()
  await expect(page.getByText('🥇')).toBeVisible()
  // Ana tiene 100% en su evento → aparece en el ranking
  await expect(page.getByText('Ana Puntual')).toHaveCount(1)
})

// HU-14: director filtra reportes por período
test('director filters reports by period pills', async ({ page, context, baseURL }) => {
  await signInAs(context, baseURL!, directorEmail)
  await page.goto('/reportes')

  await page.getByRole('button', { name: /Esta semana/i }).click()
  await expect(page).toHaveURL(/periodo=week/)

  await page.getByRole('button', { name: /Este mes/i }).click()
  await expect(page).toHaveURL(/periodo=month/)

  await page.getByRole('button', { name: /^Todo$/i }).click()
  await expect(page).toHaveURL(/periodo=all/)
})

// HU-16: director salda una multa desde el reporte individual de un miembro
test('director settles a fine from member report page', async ({ page, context, baseURL }) => {
  await signInAs(context, baseURL!, directorEmail)
  await page.goto(`/reportes/miembro/${member3Id}`)

  await expect(page.getByText('Pedro Ausente')).toBeVisible()
  // fine_absent de Ensayo = 10.000
  await expect(page.getByText(/Bs\s*10[.,]000/i).first()).toBeVisible()

  await page.getByRole('button', { name: /Saldar/i }).click()
  // La acción server recarga la página; esperamos a que el botón desaparezca
  await page.waitForLoadState('networkidle')
  await page.reload()
  await expect(page.getByRole('button', { name: /Saldar/i })).toHaveCount(0)

  const { data } = await db
    .from('attendances')
    .select('fine_amount')
    .eq('event_id', eventAbsentId)
    .eq('user_id', member3Id)
    .single()
  expect(data?.fine_amount).toBe(0)
})

// HU-17: director ve multas agrupadas por evento en /reportes/multas
test('director sees fines grouped by event on /reportes/multas', async ({ page, context, baseURL }) => {
  // Verificar que hay multas pendientes en la DB (datos preexistentes del sistema)
  const { data: existingFines } = await db
    .from('attendances')
    .select('fine_amount, events(title)')
    .gt('fine_amount', 0)
    .limit(1)
  const hasFines = existingFines && existingFines.length > 0
  const firstFineTitle = (existingFines?.[0] as any)?.events?.title

  await signInAs(context, baseURL!, directorEmail)
  await page.goto('/reportes/multas')

  await expect(page.getByRole('heading', { name: /Multas por cobrar/i })).toBeVisible()

  if (hasFines && firstFineTitle) {
    // Hay multas preexistentes → la página debe mostrarlas
    await expect(page.getByText(firstFineTitle)).toBeVisible()
  } else {
    // Fallback: los datos E2E del beforeAll deben aparecer
    await expect(page.getByText('Ensayo Con Tardanza')).toBeVisible()
  }
})
