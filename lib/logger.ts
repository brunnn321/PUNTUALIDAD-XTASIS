import * as Sentry from '@sentry/nextjs'

type LogLevel = 'info' | 'warn' | 'error'

const logLevel = process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'warn')

const levelPriority: Record<LogLevel, number> = { info: 0, warn: 1, error: 2 }

function shouldEmit(level: LogLevel) {
  return levelPriority[level] >= levelPriority[logLevel as LogLevel ?? 'warn']
}

function emit(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const entry = { level, message, timestamp: new Date().toISOString(), ...context }
  const line = JSON.stringify(entry)
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line)

  if (level !== 'info') {
    Sentry.captureMessage(message, { level: level === 'warn' ? 'warning' : 'error', extra: context })
  }
}

export function logInfo(message: string, context?: Record<string, unknown>) {
  if (shouldEmit('info')) emit('info', message, context)
}

export function logWarn(message: string, context?: Record<string, unknown>) {
  if (shouldEmit('warn')) emit('warn', message, context)
}

export function logError(message: string, context?: Record<string, unknown>) {
  emit('error', message, context)
}
