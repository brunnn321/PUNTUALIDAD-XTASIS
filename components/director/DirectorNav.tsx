'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Calendar, Users, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Inicio' },
  { href: '/eventos',   icon: Calendar,        label: 'Eventos' },
  { href: '/miembros',  icon: Users,           label: 'Miembros' },
  { href: '/reportes',  icon: BarChart3,       label: 'Reportes' },
]

export default function DirectorNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-foreground/8 z-50 shadow-e2">
      <div className="flex" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {nav.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 pt-2 pb-2.5 text-xs font-medium transition-colors relative btn-focus',
                active ? 'text-brand-500' : 'text-foreground/35 hover:text-foreground/60'
              )}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-brand-500" />
              )}
              <Icon size={21} strokeWidth={active ? 2.2 : 1.8} />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
