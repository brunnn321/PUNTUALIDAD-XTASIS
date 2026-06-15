import { describe, it, expect } from 'vitest'
import { formatDate, formatDateTime, formatTime, fromNow, formatCurrency, cn } from '@/lib/utils'

describe('formatDate', () => {
  it('formats a date in Spanish long format', () => {
    expect(formatDate('2025-06-15T12:00:00Z')).toBe('15 de junio, 2025')
  })

  it('formats January correctly', () => {
    expect(formatDate('2025-01-01T12:00:00Z')).toBe('1 de enero, 2025')
  })

  it('accepts a Date object', () => {
    const d = new Date('2025-12-25T12:00:00Z')
    expect(formatDate(d)).toBe('25 de diciembre, 2025')
  })
})

describe('formatDateTime', () => {
  it('uses the interpunct separator ·', () => {
    expect(formatDateTime('2025-06-15T14:30:00Z')).toContain(' · ')
  })

  it('includes the day number', () => {
    expect(formatDateTime('2025-06-15T14:30:00Z')).toContain('15')
  })

  it('includes a Spanish abbreviated month', () => {
    expect(formatDateTime('2025-06-15T14:30:00Z')).toContain('jun')
  })
})

describe('formatTime', () => {
  it('returns time in HH:mm format', () => {
    expect(formatTime(new Date())).toMatch(/^\d{2}:\d{2}$/)
  })

  it('pads single-digit hours with zero', () => {
    const date = new Date('2025-06-15T08:05:00Z')
    const result = formatTime(date)
    expect(result).toMatch(/^\d{2}:\d{2}$/)
    expect(result).toContain(':05')
  })
})

describe('formatCurrency', () => {
  it('includes the formatted amount', () => {
    expect(formatCurrency(50)).toContain('50')
  })

  it('uses comma as decimal separator (Spanish locale)', () => {
    expect(formatCurrency(50.5)).toContain(',')
  })

  it('formats zero', () => {
    expect(formatCurrency(0)).toContain('0')
  })

  it('formats large amounts', () => {
    expect(formatCurrency(1000)).toContain('1')
    expect(formatCurrency(1000)).toContain('000')
  })

  it('formats negative amounts with a minus sign', () => {
    expect(formatCurrency(-20)).toContain('-')
    expect(formatCurrency(-20)).toContain('20')
  })
})

describe('fromNow', () => {
  it('returns a Spanish relative string for future dates', () => {
    const future = new Date(Date.now() + 2 * 60 * 60 * 1000)
    expect(fromNow(future)).toMatch(/en|hora/)
  })

  it('returns a Spanish relative string for past dates', () => {
    const past = new Date(Date.now() - 5 * 60 * 1000)
    expect(fromNow(past)).toMatch(/hace|minuto/)
  })
})

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('resolves Tailwind conflicts (last wins)', () => {
    expect(cn('p-4', 'p-8')).toBe('p-8')
  })

  it('ignores falsy values', () => {
    expect(cn('foo', false && 'bar', undefined, 'baz')).toBe('foo baz')
  })
})
