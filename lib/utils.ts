import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow } from 'date-fns'
import { format as formatTz, toZonedTime } from 'date-fns-tz'
import { es } from 'date-fns/locale'
import type { AttendanceStatus, EventStatus, SectionName } from './supabase/types'

const TZ = 'America/La_Paz'

function toLocal(date: string | Date) {
  return toZonedTime(new Date(date), TZ)
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return formatTz(toLocal(date), "d 'de' MMMM, yyyy", { locale: es })
}

export function formatDateTime(date: string | Date) {
  return formatTz(toLocal(date), "d MMM · HH:mm", { locale: es })
}

export function formatTime(date: string | Date) {
  return formatTz(toLocal(date), 'HH:mm', { locale: es })
}

export function fromNow(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es })
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB', maximumFractionDigits: 2 }).format(amount)
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

export const EVENT_STATUS_CONFIG: Record<EventStatus, { label: string; color: string; bg: string; dot: string }> = {
  scheduled: { label: 'Programado', color: 'text-gray-600',  bg: 'bg-gray-100',   dot: 'bg-gray-400'   },
  open:      { label: 'Abierto',    color: 'text-green-700', bg: 'bg-green-100',  dot: 'bg-green-500'  },
  closed:    { label: 'Cerrado',    color: 'text-red-600',   bg: 'bg-red-100',    dot: 'bg-red-400'    },
}
