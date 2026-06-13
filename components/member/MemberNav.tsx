'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, CalendarDays, Wallet, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/home',        icon: Home,         label: 'Inicio' },
  { href: '/mis-eventos', icon: CalendarDays, label: 'Mis eventos' },
  { href: '/mis-multas',  icon: Wallet,       label: 'Mis multas' },
  { href: '/perfil',      icon: User,         label: 'Perfil' },
]

export default function MemberNav() {
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
