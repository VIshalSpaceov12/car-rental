import type { SystemLogEntry, SystemLogLevel, SystemLogStats } from '@car-rental/types'

/**
 * In-memory ring buffer of application/system logs (GACNation's LogStorageService
 * pattern, adapted). Holds the most recent MAX_LOGS entries; oldest fall off. Not
 * persisted — this is a live ops console.
 */
const MAX_LOGS = 1000

const buffer: SystemLogEntry[] = []

export function addLog(
  level: SystemLogLevel,
  message: string,
  context: string,
  metadata?: Record<string, unknown>,
): void {
  buffer.push({ timestamp: new Date().toISOString(), level, context, message, ...(metadata ? { metadata } : {}) })
  if (buffer.length > MAX_LOGS) buffer.splice(0, buffer.length - MAX_LOGS)
}

export interface QueryParams {
  limit?: number
  level?: SystemLogLevel
  minutes?: number
}

/** Newest-first. `minutes` (time window) overrides `limit` when supplied. */
export function query({ limit = 100, level, minutes }: QueryParams): SystemLogEntry[] {
  let logs = buffer
  if (minutes != null) {
    const cutoff = Date.now() - minutes * 60_000
    logs = logs.filter((l) => new Date(l.timestamp).getTime() >= cutoff)
  }
  if (level) logs = logs.filter((l) => l.level === level)
  const newestFirst = [...logs].reverse()
  return minutes != null ? newestFirst : newestFirst.slice(0, limit)
}

export function stats(): SystemLogStats {
  const s: SystemLogStats = { totalLogs: buffer.length, errorCount: 0, warnCount: 0, infoCount: 0, debugCount: 0 }
  for (const l of buffer) {
    if (l.level === 'error') s.errorCount++
    else if (l.level === 'warn') s.warnCount++
    else if (l.level === 'debug') s.debugCount++
    else s.infoCount++
  }
  return s
}

export function clear(): void {
  buffer.length = 0
}
