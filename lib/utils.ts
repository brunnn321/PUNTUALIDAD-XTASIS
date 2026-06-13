import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import type { AttendanceStatus, SectionName } from './supabase/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return format(new Date(date), "d 'de' MMMM, yyyy", { locale: es })
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), "d MMM · HH:mm", { locale: es })
}

export function formatTime(date: string | Date) {
  return format(new Date(date), 'HH:mm', { locale: es })
}

export function fromNow(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es })
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount)
}

export const SECTION_LABELS: Record<SectionName, string> = {
  vientos:   'Vientos',
  voces:     'Voces',
  bailarines:'Bailarines',
  armonia:   'Armonía',
  percusion: 'Percusión',
  staff:     'Staff',
}

export const STATUS_CONFIG: Record<AttendanceStatus, { label: string; color: string; bg: string }> = {
  present: { label: 'Presente',  color: 'text-green-700',  bg: 'bg-green-100' },
  late:    { label: 'Tardanza',  color: 'text-amber-700',  bg: 'bg-amber-100' },
  absent:  { label: 'Falta',     color: 'text-red-700',    bg: 'bg-red-100'   },
}
