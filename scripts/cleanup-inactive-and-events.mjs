import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    })
)

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// 1. Eliminar todos los eventos (cascada borra sus asistencias)
const { data: events } = await supabase.from('events').select('id, title')
console.log(`Eliminando ${events?.length ?? 0} eventos...`)
for (const e of events ?? []) {
  const { error } = await supabase.from('events').delete().eq('id', e.id)
  console.log(error ? `  ERROR "${e.title}": ${error.message}` : `  OK "${e.title}"`)
}

// 2. Eliminar todos los miembros inactivos (auth.admin.deleteUser cascada borra el perfil)
const { data: inactive } = await supabase.from('profiles').select('id, full_name').eq('active', false)
console.log(`\nEliminando ${inactive?.length ?? 0} miembros inactivos...`)
for (const m of inactive ?? []) {
  const { error } = await supabase.auth.admin.deleteUser(m.id)
  console.log(error ? `  ERROR "${m.full_name}": ${error.message}` : `  OK "${m.full_name}"`)
}

console.log('\nListo.')
