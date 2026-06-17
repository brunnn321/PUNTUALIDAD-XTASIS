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

// HU-01 + HU-11: la página de login muestra error cuando llega con ?error=inactive
// (El callback OAuth es quien hace el signOut y redirige; aquí verificamos que la UI lo muestra)
test('login page shows inactive error message when redirected with ?error=inactive', async ({ page }) => {
  await page.goto('/login?error=inactive')

  await expect(page.getByText(/Usuario inactivo/i)).toBeVisible()
  await expect(page.getByRole('button', { name: /Continuar con Google/i })).toBeVisible()
})

// HU-01b: la página /bienvenida muestra el perfil del miembro y permite confirmar identidad
test('bienvenida page shows member profile and confirm button', async ({ page, context, baseURL }) => {
  const member = await createE2EUser({
    email: uniqueEmail('new-member-welcome'),
    fullName: 'Miembro Bienvenida Test',
    role: 'member',
    section: 'voces',
  })
  createdUsers.push(member.id)

  await db.from('profiles').update({ welcomed: false }).eq('id', member.id)

  await signInAs(context, baseURL!, member.email)
  // Navegar directamente a /bienvenida (el callback la devuelve ahí en primer login)
  await page.goto('/bienvenida')

  await expect(page.getByText('¡Bienvenido!')).toBeVisible()
  await expect(page.getByText('Miembro Bienvenida Test')).toBeVisible()
  await expect(page.getByRole('button', { name: /Sí, soy yo/i })).toBeVisible()

  // Confirmar identidad → debe navegar fuera de /bienvenida (a / o /home)
  await page.getByRole('button', { name: /Sí, soy yo/i }).click()
  await expect(page).not.toHaveURL(/\/bienvenida/)
  // La URL destino es el kiosco (/) o home según estado del sistema
  await expect(page).toHaveURL(/\/(home)?$/)
})

// HU-01b: nuevo miembro con welcomed=true no pasa por bienvenida
test('member with welcomed=true goes directly to kiosk without seeing bienvenida', async ({ page, context, baseURL }) => {
  const member = await createE2EUser({
    email: uniqueEmail('welcomed-member'),
    fullName: 'Miembro Bienvenido',
    role: 'member',
    section: 'percusion',
  })
  createdUsers.push(member.id)

  await db.from('profiles').update({ welcomed: true }).eq('id', member.id)

  await signInAs(context, baseURL!, member.email)
  await page.goto('/')

  await expect(page).not.toHaveURL(/\/bienvenida/)
})
