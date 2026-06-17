import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@car-rental/tokens'
import type { SystemLogEntry, SystemLogLevel } from '@car-rental/types'
import { useSystemLogsQuery, useClearSystemLogsMutation } from '../../store/systemLogsApi'

type LevelFilter = 'all' | SystemLogLevel
const LEVELS: LevelFilter[] = ['all', 'error', 'warn', 'info', 'debug']

const LEVEL_KEY: Record<LevelFilter, `logs.level.${LevelFilter}`> = {
  all: 'logs.level.all',
  error: 'logs.level.error',
  warn: 'logs.level.warn',
  info: 'logs.level.info',
  debug: 'logs.level.debug',
}

function levelColor(level: SystemLogLevel, theme: ReturnType<typeof useTheme>): string {
  switch (level) {
    case 'error':
      return theme.color.danger
    case 'warn':
      return theme.color.warning
    case 'debug':
      return theme.color.textMuted
    default:
      return theme.color.text
  }
}

const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString()

/** GACNation-style live log console: terminal-style stream, level filter, stats. */
export function LogsScreen() {
  const theme = useTheme()
  const { t } = useTranslation()
  const [level, setLevel] = useState<LevelFilter>('all')
  const [autoScroll, setAutoScroll] = useState(true)
  const [notice, setNotice] = useState<string | null>(null)
  const consoleRef = useRef<HTMLDivElement>(null)

  // Auto-refresh every 5s, matching GACNation's live console.
  const { data, isLoading, isError } = useSystemLogsQuery(
    { limit: 200, ...(level === 'all' ? {} : { level }) },
    { pollingInterval: 5000 },
  )
  const [clearLogs, { isLoading: clearing }] = useClearSystemLogsMutation()

  // API returns newest-first; show oldest→newest so new lines append at the bottom.
  const lines: SystemLogEntry[] = data ? [...data.logs].reverse() : []
  const stats = data?.stats

  useEffect(() => {
    if (autoScroll && consoleRef.current) consoleRef.current.scrollTop = consoleRef.current.scrollHeight
  }, [lines.length, autoScroll])

  const copyAll = async () => {
    const text = lines
      .map((l) => `[${fmtTime(l.timestamp)}] [${l.level.toUpperCase()}] ${l.context ? `[${l.context}] ` : ''}${l.message}`)
      .join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setNotice(t('logs.copied'))
    } catch {
      setNotice(t('logs.copyFailed'))
    }
  }

  const onClear = async () => {
    setNotice(null)
    try {
      await clearLogs().unwrap()
      setNotice(t('logs.cleared'))
    } catch {
      setNotice(t('logs.clearFailed'))
    }
  }

  const statCard = (label: string, value: number, color: string) => (
    <div
      style={{
        flex: 1,
        minWidth: 110,
        background: theme.color.surface,
        borderRadius: theme.radius.card,
        padding: theme.spacing.md,
      }}
    >
      <div style={{ fontSize: theme.typography.heading.fontSize, fontWeight: theme.typography.heading.fontWeight, color }}>
        {value}
      </div>
      <div style={{ fontSize: theme.typography.caption.fontSize, color: theme.color.textMuted }}>{label}</div>
    </div>
  )

  const levelButton = (l: LevelFilter) => {
    const on = level === l
    return (
      <button
        key={l}
        type="button"
        onClick={() => setLevel(l)}
        style={{
          background: on ? theme.color.primary : theme.color.surface,
          color: on ? theme.color.onPrimary : theme.color.text,
          border: `1px solid ${on ? theme.color.primary : theme.color.border}`,
          borderRadius: theme.radius.sm,
          padding: `${theme.spacing.xs}px ${theme.spacing.md}px`,
          fontSize: theme.typography.caption.fontSize,
          cursor: 'pointer',
        }}
      >
        {t(LEVEL_KEY[l])}
      </button>
    )
  }

  return (
    <div>
      <h1 style={{ color: theme.color.primary, marginTop: 0 }}>{t('logs.title')}</h1>
      <p style={{ color: theme.color.textMuted, marginTop: 0 }}>{t('logs.subtitle')}</p>

      {stats && (
        <div style={{ display: 'flex', gap: theme.spacing.md, flexWrap: 'wrap', marginBottom: theme.spacing.md }}>
          {statCard(t('logs.stat.total'), stats.totalLogs, theme.color.text)}
          {statCard(t('logs.stat.errors'), stats.errorCount, theme.color.danger)}
          {statCard(t('logs.stat.warnings'), stats.warnCount, theme.color.warning)}
          {statCard(t('logs.stat.info'), stats.infoCount, theme.color.text)}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.sm,
          flexWrap: 'wrap',
          marginBottom: theme.spacing.sm,
        }}
      >
        {LEVELS.map(levelButton)}
        <span style={{ flex: 1 }} />
        <label style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs, color: theme.color.textMuted }}>
          <input type="checkbox" checked={autoScroll} onChange={(e) => setAutoScroll(e.target.checked)} />
          {t('logs.autoScroll')}
        </label>
        <button
          type="button"
          onClick={copyAll}
          style={{
            background: theme.color.surface,
            color: theme.color.text,
            border: `1px solid ${theme.color.border}`,
            borderRadius: theme.radius.sm,
            padding: `${theme.spacing.xs}px ${theme.spacing.md}px`,
            cursor: 'pointer',
          }}
        >
          {t('logs.copyAll')}
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={clearing}
          style={{
            background: theme.color.danger,
            color: theme.color.onPrimary,
            border: 'none',
            borderRadius: theme.radius.sm,
            padding: `${theme.spacing.xs}px ${theme.spacing.md}px`,
            cursor: clearing ? 'default' : 'pointer',
            opacity: clearing ? 0.6 : 1,
          }}
        >
          {t('logs.clear')}
        </button>
      </div>

      {notice && <p style={{ color: theme.color.textMuted, marginTop: 0 }}>{notice}</p>}
      {isLoading && <p style={{ color: theme.color.textMuted }}>{t('logs.loading')}</p>}
      {isError && <p style={{ color: theme.color.danger }}>{t('logs.loadFailed')}</p>}

      {!isError && (
        <div
          ref={consoleRef}
          style={{
            height: 480,
            overflow: 'auto',
            background: theme.color.surface,
            border: `1px solid ${theme.color.border}`,
            borderRadius: theme.radius.md,
            padding: theme.spacing.md,
            fontFamily: 'monospace',
            fontSize: theme.typography.caption.fontSize,
            lineHeight: 1.6,
          }}
        >
          {lines.length === 0 && !isLoading && (
            <span style={{ color: theme.color.textMuted }}>{t('logs.empty')}</span>
          )}
          {lines.map((l, i) => (
            <div key={`${l.timestamp}-${i}`} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              <span style={{ color: theme.color.textSubtle }}>[{fmtTime(l.timestamp)}]</span>{' '}
              <span style={{ color: levelColor(l.level, theme), fontWeight: theme.typography.label.fontWeight }}>
                {l.level.toUpperCase().padEnd(5)}
              </span>{' '}
              {l.context && <span style={{ color: theme.color.primary }}>[{l.context}]</span>}{' '}
              <span style={{ color: theme.color.text }}>{l.message}</span>
            </div>
          ))}
        </div>
      )}

      <p style={{ color: theme.color.textMuted, fontSize: theme.typography.caption.fontSize, marginBottom: 0 }}>
        {t('logs.entries', { n: lines.length })}
      </p>
    </div>
  )
}
