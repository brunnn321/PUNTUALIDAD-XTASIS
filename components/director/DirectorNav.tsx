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
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-50">
      <div className="flex">
        {nav.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex-1 flex flex-col items-center gap-1 py-2 text-xs transition-colors',
              pathname.startsWith(href)
                ? 'text-violet-600'
                : 'text-gray-500 hover:text-gray-900'
            )}
          >
            <Icon size={22} />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
