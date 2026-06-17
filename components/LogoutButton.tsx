'use client'

import { LogOut } from 'lucide-react'
import { logout } from '@/lib/actions/auth'

export default function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="w-full flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-red-500 transition-colors py-3"
      >
        <LogOut size={16} />
        Cerrar sesión
      </button>
    </form>
  )
}
