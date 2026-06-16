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

const { data: inactive } = await supabase.from('profiles').select('id, full_name, role').eq('active', false)
const { data: events } = await supabase.from('events').select('id, title, status, starts_at')
const { data: attendances } = await supabase.from('attendances').select('id', { count: 'exact', head: true })

console.log('--- Miembros INACTIVOS (role incluido por si hay directores inactivos) ---')
console.log(inactive?.length ?? 0, 'registros')
inactive?.forEach(m => console.log(' -', m.full_name, `(${m.role})`))

console.log('\n--- TODOS los eventos ---')
console.log(events?.length ?? 0, 'registros')
events?.forEach(e => console.log(' -', e.title, e.status, e.starts_at))

console.log('\n--- Asistencias totales (se borran en cascada con los eventos) ---')
console.log(attendances)
