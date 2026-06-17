import { logError } from '@/lib/logger'

type SupabaseErrorLike = { message: string; code?: string; details?: string }

export function logSupabaseError(
  context: string,
  error: SupabaseErrorLike | null,
  extra?: Record<string, unknown>
) {
  if (!error) return false
  logError(`Supabase error: ${context}`, {
    code: error.code,
    message: error.message,
    details: error.details,
    ...extra,
  })
  return true
}
