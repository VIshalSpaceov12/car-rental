/**
 * Application / system log contract (GACNation-style log console). Runtime app +
 * HTTP logs, held in an in-memory ring buffer on the API and surfaced read-only
 * to the dashboard.
 */
export type SystemLogLevel = 'info' | 'warn' | 'error' | 'debug'

export interface SystemLogEntry {
  timestamp: string
  level: SystemLogLevel
  context: string
  message: string
  metadata?: Record<string, unknown>
}

export interface SystemLogStats {
  totalLogs: number
  errorCount: number
  warnCount: number
  infoCount: number
  debugCount: number
}

/** The list endpoint returns the page of entries plus aggregate counts. */
export interface SystemLogsResponse {
  logs: SystemLogEntry[]
  stats: SystemLogStats
}

export interface SystemLogQuery {
  limit?: number
  level?: SystemLogLevel
  /** When set, returns entries from the last N minutes (overrides limit). */
  minutes?: number
}
