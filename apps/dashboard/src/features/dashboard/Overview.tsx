import { useEffect, useState } from 'react'
import { animate, motion, useMotionValue, useReducedMotion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@car-rental/tokens'
import type { AuthUser } from '@car-rental/types'
import { useMotion } from '../../components/motion'
import { AnimatedList, AnimatedRow } from '../../components/AnimatedRow'
import { Skeleton } from '../../components/Skeleton'
import { TitleRow } from '../../components/TitleRow'
import { useProviderVehiclesQuery, useBranchesQuery } from '../../store/fleetApi'
import { useGetBookingsQuery } from '../../store/bookingApi'

// One-off layout dimensions / type sizes (no semantic token fits) — named consts.
/** Stat value type size — the mockup's 30px display-lite number (not the 56px display token). */
const STAT_VALUE_FONT_SIZE = 30
/** Inline sparkline height (matches the mockup's viewBox 0 0 100 26). */
const SPARKLINE_HEIGHT = 26

type TrendDir = 'up' | 'down'
type SparkRole = 'success' | 'primary' | 'warning'

/** One animated count-up number. Tweens 0→value through a framer-motion MotionValue. */
function CountUp({ value }: { value: number }) {
  const theme = useTheme()
  const reduce = useReducedMotion() ?? false
  const mv = useMotionValue(0)
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (reduce) {
      setDisplay(value)
      return
    }
    const controls = animate(mv, value, {
      duration: theme.motion.duration.hero / 1000,
      ease: theme.motion.easing.standard,
      onUpdate: (v) => setDisplay(Math.round(v)),
    })
    return () => controls.stop()
  }, [value, reduce, mv, theme.motion.duration.hero, theme.motion.easing.standard])

  return <span>{display.toLocaleString('en-US')}</span>
}

/** Pre-shaped 7-point sparkline paths (viewBox 0 0 100 26), one per card. */
const SPARK_PATHS: Record<SparkRole, string> = {
  success: 'M2 20 L18 16 L34 18 L50 10 L66 13 L82 6 L98 4',
  primary: 'M2 18 L18 19 L34 12 L50 14 L66 8 L82 10 L98 5',
  warning: 'M2 6 L18 9 L34 7 L50 13 L66 11 L82 16 L98 14',
}

interface StatCardProps {
  label: string
  value: number
  loading: boolean
  /** Optional unit suffix shown muted beside the value (e.g. `%`, `AED`). */
  unit?: string
  trend: { dir: TrendDir; pct: number }
  spark: SparkRole
}

function StatCard({ label, value, loading, unit, trend, spark }: StatCardProps) {
  const theme = useTheme()
  const sparkColor =
    spark === 'success' ? theme.color.success : spark === 'primary' ? theme.color.primary : theme.color.warning
  const trendColor = trend.dir === 'up' ? theme.color.success : theme.color.danger
  return (
    <div
      style={{
        background: theme.color.surface,
        border: `1px solid ${theme.color.border}`,
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
      }}
    >
      <div style={{ color: theme.color.textMuted, fontSize: theme.typography.caption.fontSize, fontWeight: theme.typography.label.fontWeight }}>
        {label}
      </div>
      {loading ? (
        <Skeleton width={theme.size.control.lg} height={STAT_VALUE_FONT_SIZE} style={{ marginBlockStart: theme.spacing.xs }} />
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: theme.spacing.xs,
            marginBlockStart: theme.spacing.xs,
            color: theme.color.text,
            fontSize: STAT_VALUE_FONT_SIZE,
            fontWeight: theme.typography.display.fontWeight,
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
          }}
        >
          <CountUp value={value} />
          {unit && (
            <span style={{ fontSize: theme.typography.body.fontSize, color: theme.color.textMuted, fontWeight: theme.typography.label.fontWeight }}>
              {unit}
            </span>
          )}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBlockStart: theme.spacing.sm }}>
        <span style={{ color: trendColor, fontSize: theme.typography.caption.fontSize, fontWeight: theme.typography.label.fontWeight }}>
          {trend.dir === 'up' ? '▲' : '▼'} {trend.pct}%
        </span>
        <svg
          viewBox="0 0 100 26"
          preserveAspectRatio="none"
          fill="none"
          stroke={sparkColor}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          style={{ flex: 1, height: SPARKLINE_HEIGHT }}
        >
          <path d={SPARK_PATHS[spark]} />
        </svg>
      </div>
    </div>
  )
}

// Representative demo metrics for figures we don't compute server-side yet (it's a
// demo dashboard): utilization % and month-to-date revenue. Active bookings is real
// (the bookings query length). Trends are illustrative.
const UTILIZATION_PCT = 84
const REVENUE_MTD = 96400
const TREND_ACTIVE = { dir: 'up' as const, pct: 12 }
const TREND_UTILIZATION = { dir: 'up' as const, pct: 5 }
const TREND_REVENUE = { dir: 'down' as const, pct: 3 }

/**
 * Overview section — title row + three Midnight GT stat cards (active bookings,
 * fleet utilization, MTD revenue) with count-up + sparkline, on a 3-column grid.
 * Active bookings is real (bookings query); utilization/revenue use representative
 * demo values. While loading, the number is a shimmer Skeleton.
 */
export function Overview({ user }: { user: AuthUser | null | undefined }) {
  const theme = useTheme()
  const m = useMotion()
  const { t } = useTranslation()
  const { data: bookings = [], isLoading: bkLoading } = useGetBookingsQuery()
  // Kept queried so the count is live data, even though only bookings drives a card.
  useProviderVehiclesQuery()
  useBranchesQuery()

  return (
    <motion.div
      initial={{ opacity: 0, y: m.riseY }}
      animate={{ opacity: 1, y: 0 }}
      transition={m.enter}
    >
      <TitleRow title={t('overview.title')} subtitle={t('overview.subtitle')} />
      <p style={{ color: theme.color.text }}>
        {t('overview.welcome', { name: user?.name ?? '', role: user?.role ?? '' })}
      </p>
      <p style={{ color: theme.color.textMuted }}>{t('overview.tenant', { tenant: user?.providerId ?? '—' })}</p>

      <AnimatedList
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: theme.spacing.md,
          marginBlock: theme.spacing.lg,
        }}
      >
        <AnimatedRow>
          <StatCard label={t('overview.statActiveBookings')} value={bookings.length} loading={bkLoading} trend={TREND_ACTIVE} spark="success" />
        </AnimatedRow>
        <AnimatedRow>
          <StatCard label={t('overview.statUtilization')} value={UTILIZATION_PCT} loading={false} unit="%" trend={TREND_UTILIZATION} spark="primary" />
        </AnimatedRow>
        <AnimatedRow>
          <StatCard label={t('overview.statRevenue')} value={REVENUE_MTD} loading={false} unit="AED" trend={TREND_REVENUE} spark="warning" />
        </AnimatedRow>
      </AnimatedList>

      <p style={{ color: theme.color.textMuted }}>{t('overview.intro')}</p>
    </motion.div>
  )
}
