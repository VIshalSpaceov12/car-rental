import type { SystemLogLevel } from '@car-rental/types'
import { addLog } from './log-store'

/**
 * App logger that records into the in-memory store AND mirrors to the console
 * (GACNation's CustomLoggerService pattern). Use for notable app events that
 * should surface in the Logs console.
 */
function emit(level: SystemLogLevel, message: string, context = 'Application', metadata?: Record<string, unknown>) {
  addLog(level, message, context, metadata)
  const line = `[${context}] ${message}`
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.info(line)
}

export const logger = {
  info: (message: string, context?: string, metadata?: Record<string, unknown>) => emit('info', message, context, metadata),
  warn: (message: string, context?: string, metadata?: Record<string, unknown>) => emit('warn', message, context, metadata),
  error: (message: string, context?: string, metadata?: Record<string, unknown>) =>
    emit('error', message, context, metadata),
  debug: (message: string, context?: string, metadata?: Record<string, unknown>) =>
    emit('debug', message, context, metadata),
}
