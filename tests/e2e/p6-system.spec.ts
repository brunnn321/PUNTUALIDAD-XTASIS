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

// HU-33: evento expirado (starts_at > 1h atrás) se auto-cierra al cargar /home
test('expired open event is auto-closed when member loads /home', async ({ page, context, baseURL }) => {
  const director = await createE2EUser({
    email: uniqueEmail('director-autoclose'),
    fullName: 'Directora Autoclose',
    role: 'director',
  })
  const member = await createE2EUser({
    email: uniqueEmail('member-autoclose'),
    fullName: 'Miembro Autoclose',
    role: 'member',
    section: 'vientos',
  })
  createdUsers.push(director.id, member.id)

  // Evento que empezó hace 90 minutos → la ventana de 1h ya expiró, debe auto-cerrarse
  const eventId = await createE2EEvent({
    title: 'Ensayo Expirado Autoclose',
    createdBy: director.id,
    startsAt: pastIso(90),
    status: 'open',
  })
  createdEvents.push(eventId)

  await signInAs(context, baseURL!, member.email)
  await page.goto('/home')
  await page.waitForLoadState('networkidle')

  // Tras cargar /home, autoCloseExpiredEvents() debe haber cerrado el evento
  const { data } = await db.from('events').select('status').eq('id', eventId).single()
  expect(data?.status).toBe('closed')
})

// HU-33: evento expirado se auto-cierra al cargar /dashboard (director)
test('expired open event is auto-closed when director loads /dashboard', async ({ page, context, baseURL }) => {
  const director = await createE2EUser({
    email: uniqueEmail('director-autoclose-dash'),
    fullName: 'Directora Autoclose Dash',
    role: 'director',
  })
  createdUsers.push(director.id)

  const eventId = await createE2EEvent({
    title: 'Ensayo Expirado Dashboard',
    createdBy: director.id,
    startsAt: pastIso(90),
    status: 'open',
  })
  createdEvents.push(eventId)

  await signInAs(context, baseURL!, director.email)
  await page.goto('/dashboard')
  await page.waitForLoadState('networkidle')

  const { data } = await db.from('events').select('status').eq('id', eventId).single()
  expect(data?.status).toBe('closed')
})

// HU-28 + HU-29: check-in con ≤1 min de diferencia → estado "present" sin multa
test('member checking in within 1 minute tolerance gets present status with no fine', async ({ page, context, baseURL }) => {
  const director = await createE2EUser({
    email: uniqueEmail('director-tolerance'),
    fullName: 'Directora Tolerancia',
    role: 'director',
  })
  const member = await createE2EUser({
    email: uniqueEmail('member-tolerance'),
    fullName: 'Miembro Tolerancia',
    role: 'member',
    section: 'vientos',
  })
  createdUsers.push(director.id, member.id)

  // starts_at = ahora mismo (dentro de la tolerancia de 1 min)
  const eventId = await createE2EEvent({
    title: 'Ensayo Tolerancia',
    createdBy: director.id,
    startsAt: futureIso(0),
    checkinOpensAt: pastIso(60),
    status: 'open',
  })
  createdEvents.push(eventId)

  // Insertar asistencia con checked_in_at = ahora (≤1 min desde starts_at)
  await addAttendance({
    eventId,
    userId: member.id,
    status: 'present',
    checkedInAt: new Date().toISOString(),
  })

  // Cerrar el evento para que el trigger calcule multas
  await db.rpc('close_event', { p_event_id: eventId })

  const { data } = await db
    .from('attendances')
    .select('status, fine_amount')
    .eq('event_id', eventId)
    .eq('user_id', member.id)
    .single()

  expect(data?.status).toBe('present')
  expect(data?.fine_amount).toBe(0)
})

// HU-28 + HU-29: check-in con 5 min de retraso → estado "late" con multa fine_late
test('member checking in 5 minutes late gets late status with fine_late amount', async ({ page, context, baseURL }) => {
  const director = await createE2EUser({
    email: uniqueEmail('director-late'),
    fullName: 'Directora Late',
    role: 'director',
  })
  const member = await createE2EUser({
    email: uniqueEmail('member-late'),
    fullName: 'Miembro Tardanza',
    role: 'member',
    section: 'voces',
  })
  createdUsers.push(director.id, member.id)

  const eventId = await createE2EEvent({
    title: 'Ensayo Tardanza',
    createdBy: director.id,
    startsAt: pastIso(5),       // empezó hace 5 min
    checkinOpensAt: pastIso(65),
    status: 'open',
  })
  createdEvents.push(eventId)

  // Check-in llegó 5 minutos después del starts_at → late
  await addAttendance({
    eventId,
    userId: member.id,
    status: 'late',
    checkedInAt: new Date().toISOString(),
  })

  await db.rpc('close_event', { p_event_id: eventId })

  const { data: att } = await db
    .from('attendances')
    .select('status, fine_amount')
    .eq('event_id', eventId)
    .eq('user_id', member.id)
    .single()

  expect(att?.status).toBe('late')
  // La multa debe ser mayor a 0 (fine_late del tipo de evento)
  expect(att?.fine_amount).toBeGreaterThan(0)
})

// HU-28: miembro sin check-in al cerrar evento → absent con multa fine_absent
test('member without check-in gets absent status with fine_absent after event closes', async ({ page, context, baseURL }) => {
  const director = await createE2EUser({
    email: uniqueEmail('director-absent'),
    fullName: 'Directora Absent',
    role: 'director',
  })
  const member = await createE2EUser({
    email: uniqueEmail('member-absent'),
    fullName: 'Miembro Ausente Sistema',
    role: 'member',
    section: 'armonia',
  })
  createdUsers.push(director.id, member.id)

  const eventId = await createE2EEvent({
    title: 'Ensayo Ausente Sistema',
    createdBy: director.id,
    startsAt: pastIso(30),
    targetSections: ['armonia'],
    status: 'open',
  })
  createdEvents.push(eventId)

  // No agregar asistencia — el close_event debe crearla como absent
  await db.rpc('close_event', { p_event_id: eventId })

  const { data: att } = await db
    .from('attendances')
    .select('status, fine_amount')
    .eq('event_id', eventId)
    .eq('user_id', member.id)
    .single()

  expect(att?.status).toBe('absent')
  expect(att?.fine_amount).toBeGreaterThan(0)
})
