import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@car-rental/tokens'
import { useMotion } from '../../components/motion'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { logout } from '../../store/authSlice'
import { setLocale, type Locale } from '../../i18n'
import { useBookingStatusSocket } from '../../realtime/useBookingStatusSocket'
import { FleetPage } from '../fleet/FleetPage'
import { BranchesPage } from '../fleet/BranchesPage'
import { BookingsScreen } from '../bookings/BookingsScreen'
import { BrandingPage } from '../branding/BrandingPage'
import { LogsScreen } from '../logs/LogsScreen'
import { Overview } from './Overview'

type Section = 'overview' | 'fleet' | 'branches' | 'bookings' | 'branding' | 'logs'

// One-off layout dimensions (sidebar anatomy); not cross-component semantic sizes.
const SIDEBAR_WIDTH = 224
const LOGO_TILE_SIZE = 32
const LOGO_TILE_RADIUS = 9
const USER_AVATAR_SIZE = 34
/** Active-item leading accent bar width + top/bottom inset. */
const NAV_ACCENT_WIDTH = 3
const NAV_ACCENT_INSET = 8
/** Brand name + active-tint alphas (the mockup's primary tint gradient). */
const BRAND_NAME_FONT_SIZE = 15
const TINT_ALPHA_STRONG = 0.14
const TINT_ALPHA_FAINT = 0.04

/** #RGB / #RRGGBB → rgba() at the given alpha; non-hex falls back to itself. */
function tint(hex: string, alpha: number): string {
  const m = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(hex.trim())
  if (!m) return hex
  const raw = m[1] ?? ''
  const h = raw.length === 3 ? raw.replace(/./g, (c) => c + c) : raw
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

/** First letters of the first two name words, uppercased; falls back to a dash. */
function initials(name: string | undefined): string {
  if (!name?.trim()) return '—'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase()
}

/** Shared 18px stroke-icon wrapper — the mockup's nav glyph sizing. */
function NavGlyph({ size, children }: { size: number; children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ flexShrink: 0 }}>
      {children}
    </svg>
  )
}

// Per-section nav glyphs, reusing the mockup's grid / car / pin / calendar / share /
// lines silhouettes. The car glyph also fills the brand tile.
const CarGlyph = <path d="M5 13l1.5-4.5A2 2 0 0 1 8.4 7h7.2a2 2 0 0 1 1.9 1.5L19 13M5 13h14v4H5zM7 17v2M17 17v2" />
const NAV_GLYPHS: Record<Section, ReactNode> = {
  overview: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </>
  ),
  fleet: CarGlyph,
  branches: (
    <>
      <path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  bookings: (
    <>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M3 9h18M8 2v4M16 2v4" />
    </>
  ),
  branding: (
    <>
      <circle cx="13.5" cy="6.5" r="2.5" />
      <circle cx="6.5" cy="12" r="2.5" />
      <circle cx="16" cy="16" r="2.5" />
      <path d="M3 21c1.5-3 4-4.5 7-4.5" />
    </>
  ),
  logs: <path d="M4 6h16M4 12h10M4 18h13" />,
}

const NAV_ITEMS: { key: Section; labelKey: 'nav.overview' | 'nav.fleet' | 'nav.branches' | 'nav.bookings' | 'nav.branding' | 'nav.logs' }[] = [
  { key: 'overview', labelKey: 'nav.overview' },
  { key: 'fleet', labelKey: 'nav.fleet' },
  { key: 'branches', labelKey: 'nav.branches' },
  { key: 'bookings', labelKey: 'nav.bookings' },
  { key: 'branding', labelKey: 'nav.branding' },
  { key: 'logs', labelKey: 'nav.logs' },
]

export function DashboardLayout() {
  const theme = useTheme()
  const m = useMotion()
  const { t, i18n } = useTranslation()
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)
  const branding = useAppSelector((s) => s.auth.branding)
  const [section, setSection] = useState<Section>('overview')

  // One authenticated Socket.io connection for the session; pushes live booking
  // status changes into the RTK Query board (invalidates the `Booking` tag).
  useBookingStatusSocket()

  const [g0, g1] = theme.color.gradientPrimary
  const brandGradient = `linear-gradient(135deg, ${g0}, ${g1})`

  const navItem = (key: Section, label: string) => {
    const active = section === key
    return (
      <a
        key={key}
        onClick={() => setSection(key)}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.sm,
          padding: `${theme.spacing.sm}px ${theme.spacing.sm}px`,
          paddingInlineStart: theme.spacing.md,
          borderRadius: theme.radius.sm,
          cursor: 'pointer',
          fontWeight: theme.typography.label.fontWeight,
          fontSize: theme.typography.body.fontSize,
          color: active ? theme.color.primary : theme.color.textMuted,
          background: active
            ? `linear-gradient(90deg, ${tint(theme.color.primary, TINT_ALPHA_STRONG)}, ${tint(theme.color.primary, TINT_ALPHA_FAINT)})`
            : 'transparent',
          marginBlockEnd: theme.spacing.xs,
        }}
      >
        {active && (
          // Animated leading accent: a gradient bar inset on the start edge that
          // slides between items via a shared layoutId. Logical insets so it sits
          // on the leading edge in both LTR + RTL.
          <motion.span
            layoutId="nav-accent"
            transition={m.standard}
            style={{
              position: 'absolute',
              insetInlineStart: 0,
              insetBlockStart: NAV_ACCENT_INSET,
              insetBlockEnd: NAV_ACCENT_INSET,
              width: NAV_ACCENT_WIDTH,
              borderRadius: theme.radius.pill,
              background: brandGradient,
            }}
          />
        )}
        <NavGlyph size={theme.size.icon.md}>{NAV_GLYPHS[key]}</NavGlyph>
        {label}
      </a>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: theme.typography.body.fontFamily }}>
      <aside
        style={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          background: theme.color.surface,
          borderInlineEnd: `1px solid ${theme.color.border}`,
          padding: `${theme.spacing.lg}px ${theme.spacing.md}px`,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Brand identity row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBlockEnd: theme.spacing.lg, paddingInline: theme.spacing.sm }}>
          <div
            style={{
              width: LOGO_TILE_SIZE,
              height: LOGO_TILE_SIZE,
              flexShrink: 0,
              borderRadius: LOGO_TILE_RADIUS,
              background: brandGradient,
              boxShadow: `0 8px 30px ${theme.color.glow}`,
              display: 'grid',
              placeItems: 'center',
              color: theme.color.onPrimary,
            }}
          >
            <NavGlyph size={theme.size.icon.md}>{CarGlyph}</NavGlyph>
          </div>
          <span style={{ fontSize: BRAND_NAME_FONT_SIZE, fontWeight: theme.typography.display.fontWeight, color: theme.color.text }}>
            {branding?.name ?? 'Provider Dashboard'}
          </span>
        </div>

        {NAV_ITEMS.map((n) => navItem(n.key, t(n.labelKey)))}

        {/* Bottom-pinned user chip with relocated language + logout controls */}
        <div
          style={{
            marginBlockStart: 'auto',
            background: theme.color.surfaceAlt,
            border: `1px solid ${theme.color.border}`,
            borderRadius: theme.radius.md,
            padding: theme.spacing.sm,
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing.sm,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
            <div
              style={{
                width: USER_AVATAR_SIZE,
                height: USER_AVATAR_SIZE,
                flexShrink: 0,
                borderRadius: theme.radius.pill,
                background: brandGradient,
                color: theme.color.onPrimary,
                display: 'grid',
                placeItems: 'center',
                fontWeight: theme.typography.label.fontWeight,
                fontSize: theme.typography.caption.fontSize,
              }}
            >
              {initials(user?.name)}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: theme.typography.caption.fontSize, fontWeight: theme.typography.label.fontWeight, color: theme.color.text, lineHeight: 1.1 }}>
                {user?.name ?? 'Provider Dashboard'}
              </div>
              <div style={{ fontSize: theme.typography.caption.fontSize, color: theme.color.textSubtle }}>
                {user?.role ?? '—'}
              </div>
            </div>
          </div>

          <select
            aria-label={t('language.label')}
            value={i18n.language.startsWith('ar') ? 'ar' : 'en'}
            onChange={(e) => setLocale(e.target.value as Locale)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: theme.spacing.xs,
              borderRadius: theme.radius.sm,
              border: `1px solid ${theme.color.border}`,
              background: theme.color.surface,
              color: theme.color.text,
              fontSize: theme.typography.caption.fontSize,
            }}
          >
            <option value="en">{t('language.en')}</option>
            <option value="ar">{t('language.ar')}</option>
          </select>

          <a
            onClick={() => dispatch(logout())}
            style={{
              display: 'block',
              textAlign: 'center',
              cursor: 'pointer',
              padding: theme.spacing.xs,
              borderRadius: theme.radius.sm,
              color: theme.color.textMuted,
              fontSize: theme.typography.caption.fontSize,
              fontWeight: theme.typography.label.fontWeight,
            }}
          >
            {t('nav.logout')}
          </a>
        </div>
      </aside>
      <main style={{ flex: 1, padding: theme.spacing.xl, background: theme.color.background }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={section}
            initial={{ opacity: 0, y: m.riseY }}
            animate={{ opacity: 1, y: 0, transition: m.enter }}
            exit={{ opacity: 0, y: m.reduce ? 0 : -m.riseY, transition: m.exit }}
          >
            {section === 'overview' && <Overview user={user} onViewBookings={() => setSection('bookings')} />}
            {section === 'fleet' && <FleetPage />}
            {section === 'branches' && <BranchesPage />}
            {section === 'bookings' && <BookingsScreen />}
            {section === 'branding' && <BrandingPage />}
            {section === 'logs' && <LogsScreen />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
