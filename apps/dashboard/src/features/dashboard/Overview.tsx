import { useEffect, useState, type ReactNode } from 'react'
import { animate, motion, useMotionValue, useReducedMotion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useTheme, type Theme } from '@car-rental/tokens'
import type { AuthUser, BookingStatus } from '@car-rental/types'
import { useMotion } from '../../components/motion'
import { AnimatedList, AnimatedRow } from '../../components/AnimatedRow'
import { Skeleton } from '../../components/Skeleton'
import { StatusChip } from '../../components/StatusChip'
import { useProviderVehiclesQuery, useBranchesQuery } from '../../store/fleetApi'
import { useGetBookingsQuery } from '../../store/bookingApi'

// ── One-off layout dimensions / type sizes (no semantic token fits) ──────────
/** Hero greeting size — sits between heading (28) and display (56). */
const HERO_GREETING_FONT_SIZE = 34
/** KPI value type size — the display-lite number (not the 56px display token). */
const STAT_VALUE_FONT_SIZE = 30
/** Square icon tile behind each KPI / list glyph. */
const ICON_TILE_SIZE = 38
const ICON_TILE_RADIUS = 11
/** Inline sparkline viewBox height. */
const SPARKLINE_HEIGHT = 28
/** Revenue area-chart viewBox (drawn LTR; stroke kept uniform via vectorEffect). */
const CHART_W = 320
const CHART_H = 132
const CHART_PAD_Y = 14
/** Recent-bookings preview cap. */
const RECENT_LIMIT = 5
/** Decorative hero elements — purely cosmetic one-off dimensions. */
const HERO_ORB_LG_SIZE = 220
const HERO_ORB_SM_SIZE = 180
const HERO_GLYPH_SIZE = 140
const HERO_CONTENT_MAX_WIDTH = 560

// Soft lifts for the LIGHT dashboard — the shared elevation tokens are tuned for
// the dark theme (0.18–0.28 black), too heavy on white. One-off shadow strings,
// same convention as Button.tsx's HOVER_GLOW.
const CARD_SHADOW = '0 1px 2px rgba(18,18,20,0.04), 0 10px 30px rgba(18,18,20,0.06)'
const CARD_SHADOW_HOVER = '0 2px 6px rgba(18,18,20,0.06), 0 18px 44px rgba(18,18,20,0.10)'

/** #RGB / #RRGGBB → rgba() at the given alpha; non-hex falls back to itself. */
function rgba(hex: string, alpha: number): string {
  const m = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(hex.trim())
  if (!m) return hex
  const raw = m[1] ?? ''
  const h = raw.length === 3 ? raw.replace(/./g, (c) => c + c) : raw
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

// Booking status → typed label key (the raw enum never renders; mirrors the
// bookings screen's map so both go through the localized `bookings.status.*`).
const STATUS_LABEL_KEY: Record<
  BookingStatus,
  | 'bookings.status.reserved'
  | 'bookings.status.confirmed'
  | 'bookings.status.vehicle-prepared'
  | 'bookings.status.picked-up'
  | 'bookings.status.returned'
  | 'bookings.status.completed'
  | 'bookings.status.rejected'
  | 'bookings.status.cancelled'
> = {
  reserved: 'bookings.status.reserved',
  confirmed: 'bookings.status.confirmed',
  'vehicle-prepared': 'bookings.status.vehicle-prepared',
  'picked-up': 'bookings.status.picked-up',
  returned: 'bookings.status.returned',
  completed: 'bookings.status.completed',
  rejected: 'bookings.status.rejected',
  cancelled: 'bookings.status.cancelled',
}

/** Bookings counted as "active" (on the road / in flight, not terminal). */
const ACTIVE_STATUSES: ReadonlySet<BookingStatus> = new Set<BookingStatus>([
  'confirmed',
  'vehicle-prepared',
  'picked-up',
])

type TrendDir = 'up' | 'down'

// ── Stroke glyphs (24×24, inherit currentColor) ──────────────────────────────
const ICONS = {
  bookings: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4M9 14l2 2 4-4" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  gauge: <><path d="M4 18a8 8 0 1 1 16 0" /><path d="M12 18l4-4" /></>,
  money: <><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.6" /><path d="M6 9.5v5M18 9.5v5" /></>,
  car: <path d="M5 13l1.5-4.5A2 2 0 0 1 8.4 7h7.2a2 2 0 0 1 1.9 1.5L19 13M5 13h14v4H5zM7 17v2M17 17v2" />,
  plus: <path d="M12 5v14M5 12h14" />,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
} as const

function Glyph({ size, children }: { size: number; children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ flexShrink: 0 }}>
      {children}
    </svg>
  )
}

/** Tinted rounded tile holding a role-colored glyph. */
function IconTile({ color, children }: { color: string; children: ReactNode }) {
  return (
    <div style={{ width: ICON_TILE_SIZE, height: ICON_TILE_SIZE, flexShrink: 0, borderRadius: ICON_TILE_RADIUS, background: rgba(color, 0.12), color, display: 'grid', placeItems: 'center' }}>
      {children}
    </div>
  )
}

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

/** Trend pill — arrow + percentage, tinted by direction. */
function TrendPill({ trend, theme }: { trend: { dir: TrendDir; pct: number }; theme: Theme }) {
  const color = trend.dir === 'up' ? theme.color.success : theme.color.danger
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: theme.spacing.xs, color, background: rgba(color, 0.12), borderRadius: theme.radius.pill, padding: `2px ${theme.spacing.sm}px`, fontSize: theme.typography.caption.fontSize, fontWeight: theme.typography.label.fontWeight }}>
      {trend.dir === 'up' ? '▲' : '▼'} {trend.pct}%
    </span>
  )
}

// Pre-shaped 7-point sparklines (viewBox 0 0 100 28), one per KPI card.
const SPARK_PATHS = [
  'M2 22 L18 17 L34 19 L50 11 L66 14 L82 6 L98 4',
  'M2 19 L18 20 L34 13 L50 15 L66 9 L82 11 L98 5',
  'M2 7 L18 10 L34 8 L50 14 L66 12 L82 17 L98 15',
  'M2 14 L18 12 L34 16 L50 9 L66 13 L82 7 L98 10',
] as const

interface KpiCardProps {
  label: string
  value: number
  loading: boolean
  unit?: string
  trend: { dir: TrendDir; pct: number }
  color: string
  icon: ReactNode
  sparkPath: string
}

function KpiCard({ label, value, loading, unit, trend, color, icon, sparkPath }: KpiCardProps) {
  const theme = useTheme()
  const m = useMotion()
  return (
    <motion.div
      whileHover={m.reduce ? undefined : { y: -3, boxShadow: CARD_SHADOW_HOVER }}
      transition={m.standard}
      style={{
        background: theme.color.background,
        border: `1px solid ${theme.color.border}`,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        boxShadow: CARD_SHADOW,
        height: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
        <IconTile color={color}><Glyph size={theme.size.icon.lg}>{icon}</Glyph></IconTile>
        <span style={{ color: theme.color.textMuted, fontSize: theme.typography.caption.fontSize, fontWeight: theme.typography.label.fontWeight }}>{label}</span>
      </div>

      {loading ? (
        <Skeleton width={theme.size.control.lg} height={STAT_VALUE_FONT_SIZE} style={{ marginBlockStart: theme.spacing.md }} />
      ) : (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: theme.spacing.xs, marginBlockStart: theme.spacing.md, color: theme.color.text, fontSize: STAT_VALUE_FONT_SIZE, fontWeight: theme.typography.display.fontWeight, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
          <CountUp value={value} />
          {unit && <span style={{ fontSize: theme.typography.body.fontSize, color: theme.color.textMuted, fontWeight: theme.typography.label.fontWeight }}>{unit}</span>}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBlockStart: theme.spacing.md }}>
        <TrendPill trend={trend} theme={theme} />
        <svg viewBox="0 0 100 28" preserveAspectRatio="none" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ flex: 1, height: SPARKLINE_HEIGHT }}>
          <path d={sparkPath} vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
    </motion.div>
  )
}

/** Shared section-card chrome (white tile, soft lift) with a header row. */
function PanelCard({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode }) {
  const theme = useTheme()
  return (
    <div style={{ background: theme.color.background, border: `1px solid ${theme.color.border}`, borderRadius: theme.radius.lg, padding: theme.spacing.lg, boxShadow: CARD_SHADOW, height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: theme.spacing.sm, marginBlockEnd: theme.spacing.md }}>
        <div>
          <h3 style={{ margin: 0, color: theme.color.text, fontSize: theme.typography.title.fontSize, fontWeight: theme.typography.title.fontWeight }}>{title}</h3>
          {subtitle && <p style={{ margin: 0, color: theme.color.textMuted, fontSize: theme.typography.caption.fontSize }}>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

// Illustrative 7-day revenue series (k AED). No historical endpoint yet — same
// "demo dashboard" stance as the KPI trends; ends near the headline MTD figure.
const REVENUE_SERIES = [42, 55, 48, 61, 73, 66, 96]

interface OverviewProps {
  user: AuthUser | null | undefined
  /** Jump to the bookings section (hero CTA + "view all"). */
  onViewBookings?: () => void
}

/**
 * Provider home — a premium "light" layout: a gradient hero banner, a 4-up KPI
 * row (active / pending real; utilization / revenue illustrative), and a revenue
 * area chart beside a live recent-bookings feed. Active + pending + the feed are
 * real (bookings query); utilization, MTD revenue and the 7-day series are
 * illustrative demo figures (no server metric yet).
 */
export function Overview({ user, onViewBookings }: OverviewProps) {
  const theme = useTheme()
  const m = useMotion()
  const { t } = useTranslation()
  const { data: bookings = [], isLoading: bkLoading } = useGetBookingsQuery()
  const { data: vehicles = [] } = useProviderVehiclesQuery()
  const { data: branches = [] } = useBranchesQuery()

  const activeCount = bookings.filter((b) => ACTIVE_STATUSES.has(b.status)).length
  const pendingCount = bookings.filter((b) => b.status === 'reserved').length
  const recent = [...bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, RECENT_LIMIT)

  const [g0, g1] = theme.color.gradientPrimary

  // Revenue chart geometry (LTR viz).
  const max = Math.max(...REVENUE_SERIES)
  const stepX = CHART_W / (REVENUE_SERIES.length - 1)
  const usableH = CHART_H - CHART_PAD_Y * 2
  const pts = REVENUE_SERIES.map((v, i) => [i * stepX, CHART_PAD_Y + usableH - (v / max) * usableH] as const)
  const linePath = `M ${pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L ')}`
  const areaPath = `${linePath} L ${CHART_W} ${CHART_H} L 0 ${CHART_H} Z`
  const gridYs = [0.25, 0.55, 0.85].map((f) => CHART_PAD_Y + usableH * f)

  return (
    <div>
      {/* ── Gradient hero banner ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: m.riseY }}
        animate={{ opacity: 1, y: 0 }}
        transition={m.enter}
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: `linear-gradient(135deg, ${theme.color.primaryDark}, ${g0} 50%, ${g1})`,
          borderRadius: theme.radius.xl,
          padding: theme.spacing.xl,
          boxShadow: `0 20px 60px ${theme.color.glow}`,
          color: theme.color.onPrimary,
        }}
      >
        {/* Decorative translucent orbs + faint car glyph */}
        <div aria-hidden style={{ position: 'absolute', insetBlockStart: -60, insetInlineEnd: -30, width: HERO_ORB_LG_SIZE, height: HERO_ORB_LG_SIZE, borderRadius: theme.radius.pill, background: rgba(theme.color.onPrimary,0.12) }} />
        <div aria-hidden style={{ position: 'absolute', insetBlockEnd: -90, insetInlineEnd: 120, width: HERO_ORB_SM_SIZE, height: HERO_ORB_SM_SIZE, borderRadius: theme.radius.pill, background: rgba(theme.color.onPrimary,0.08) }} />
        <div aria-hidden style={{ position: 'absolute', insetBlockEnd: -10, insetInlineEnd: theme.spacing.xl, opacity: 0.18, color: theme.color.onPrimary }}>
          <Glyph size={HERO_GLYPH_SIZE}>{ICONS.car}</Glyph>
        </div>

        <div style={{ position: 'relative', maxWidth: HERO_CONTENT_MAX_WIDTH }}>
          <span style={{ display: 'inline-block', fontSize: theme.typography.caption.fontSize, fontWeight: theme.typography.label.fontWeight, letterSpacing: 1, textTransform: 'uppercase', color: rgba(theme.color.onPrimary,0.8) }}>
            {t('nav.overview')}
          </span>
          <h1 style={{ margin: `${theme.spacing.sm}px 0 0`, fontSize: HERO_GREETING_FONT_SIZE, lineHeight: 1.1, fontWeight: theme.typography.display.fontWeight, letterSpacing: -0.5 }}>
            {t('overview.heroGreeting', { name: user?.name ?? '' })}
          </h1>
          <p style={{ margin: `${theme.spacing.sm}px 0 0`, fontSize: theme.typography.body.fontSize, color: rgba(theme.color.onPrimary,0.85) }}>
            {t('overview.heroSubtitle')}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: theme.spacing.md, marginBlockStart: theme.spacing.lg }}>
            <motion.button
              onClick={onViewBookings}
              whileTap={m.reduce ? undefined : { scale: 0.97 }}
              whileHover={m.reduce ? undefined : { y: -2 }}
              transition={m.press}
              style={{ display: 'inline-flex', alignItems: 'center', gap: theme.spacing.xs, background: theme.color.onPrimary, color: theme.color.text, border: 'none', borderRadius: theme.radius.pill, padding: `${theme.spacing.sm}px ${theme.spacing.lg}px`, fontSize: theme.typography.body.fontSize, fontWeight: theme.typography.label.fontWeight, cursor: 'pointer', boxShadow: CARD_SHADOW }}
            >
              <Glyph size={theme.size.icon.md}>{ICONS.plus}</Glyph>
              {t('overview.heroCta')}
            </motion.button>
            <span style={{ fontSize: theme.typography.caption.fontSize, color: rgba(theme.color.onPrimary,0.85) }}>
              {t('overview.heroFleet', { vehicles: vehicles.length, branches: branches.length })}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── KPI row ─────────────────────────────────────────────────────────── */}
      <AnimatedList style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: theme.spacing.md, marginBlock: theme.spacing.lg }}>
        <AnimatedRow><KpiCard label={t('overview.statActiveBookings')} value={activeCount} loading={bkLoading} trend={{ dir: 'up', pct: 12 }} color={theme.color.success} icon={ICONS.bookings} sparkPath={SPARK_PATHS[0]} /></AnimatedRow>
        <AnimatedRow><KpiCard label={t('overview.statUtilization')} value={84} loading={false} unit="%" trend={{ dir: 'up', pct: 5 }} color={theme.color.primary} icon={ICONS.gauge} sparkPath={SPARK_PATHS[1]} /></AnimatedRow>
        <AnimatedRow><KpiCard label={t('overview.statRevenue')} value={96400} loading={false} unit="AED" trend={{ dir: 'down', pct: 3 }} color={theme.color.warning} icon={ICONS.money} sparkPath={SPARK_PATHS[2]} /></AnimatedRow>
        <AnimatedRow><KpiCard label={t('overview.statPending')} value={pendingCount} loading={bkLoading} trend={{ dir: 'up', pct: 8 }} color={theme.color.primary} icon={ICONS.clock} sparkPath={SPARK_PATHS[3]} /></AnimatedRow>
      </AnimatedList>

      {/* ── Revenue chart + recent bookings ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: theme.spacing.md, alignItems: 'stretch' }}>
        <AnimatedRow style={{ minWidth: 0 }}>
          <PanelCard
            title={t('overview.revenueTitle')}
            subtitle={t('overview.revenueRange')}
            action={
              <div style={{ textAlign: 'end' }}>
                <div style={{ color: theme.color.text, fontSize: theme.typography.title.fontSize, fontWeight: theme.typography.display.fontWeight, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                  96.4<span style={{ fontSize: theme.typography.body.fontSize, color: theme.color.textMuted, fontWeight: theme.typography.label.fontWeight }}>k AED</span>
                </div>
              </div>
            }
          >
            <div style={{ direction: 'ltr', marginBlockStart: 'auto' }}>
              <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} preserveAspectRatio="none" width="100%" height={CHART_H} aria-hidden style={{ display: 'block' }}>
                <defs>
                  <linearGradient id="cr-rev-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={theme.color.primary} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={theme.color.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                {gridYs.map((y, i) => (
                  <line key={i} x1={0} y1={y} x2={CHART_W} y2={y} stroke={theme.color.border} strokeWidth={1} strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
                ))}
                <motion.path d={areaPath} fill="url(#cr-rev-fill)" stroke="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...m.enter, delay: 0.15 }} />
                <motion.path
                  d={linePath}
                  fill="none"
                  stroke={theme.color.primary}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  initial={m.reduce ? { pathLength: 1 } : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: theme.motion.duration.hero / 1000, ease: theme.motion.easing.standard }}
                />
              </svg>
            </div>
          </PanelCard>
        </AnimatedRow>

        <AnimatedRow style={{ minWidth: 0 }}>
          <PanelCard
            title={t('overview.recentTitle')}
            action={
              <a onClick={onViewBookings} style={{ display: 'inline-flex', alignItems: 'center', gap: theme.spacing.xs, color: theme.color.primary, fontSize: theme.typography.caption.fontSize, fontWeight: theme.typography.label.fontWeight, cursor: 'pointer' }}>
                {t('overview.viewAll')}
                <Glyph size={theme.size.icon.sm}>{ICONS.arrowRight}</Glyph>
              </a>
            }
          >
            {bkLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={ICON_TILE_SIZE} />)}
              </div>
            ) : recent.length === 0 ? (
              <p style={{ margin: 0, color: theme.color.textMuted, fontSize: theme.typography.body.fontSize }}>{t('overview.recentEmpty')}</p>
            ) : (
              <AnimatedList style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
                {recent.map((b) => (
                  <AnimatedRow key={b.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                      <IconTile color={theme.color.textMuted}><Glyph size={theme.size.icon.md}>{ICONS.car}</Glyph></IconTile>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ color: theme.color.text, fontSize: theme.typography.caption.fontSize, fontWeight: theme.typography.label.fontWeight, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.vehicleName}</div>
                        <div style={{ color: theme.color.textSubtle, fontSize: theme.typography.caption.fontSize, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.customerName}</div>
                      </div>
                      <StatusChip status={b.status} label={t(STATUS_LABEL_KEY[b.status])} />
                    </div>
                  </AnimatedRow>
                ))}
              </AnimatedList>
            )}
          </PanelCard>
        </AnimatedRow>
      </div>
    </div>
  )
}
