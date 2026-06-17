import { AnimatePresence, motion } from 'framer-motion'
import { useTheme, type Theme } from '@car-rental/tokens'
import type { BookingStatus } from '@car-rental/types'
import { useMotion } from './motion'

/**
 * Semantic role each booking-lifecycle status maps to. Roles (not hexes) so the
 * chip recolors with the active theme. Mapping mirrors the Midnight GT mockup:
 * `picked-up` is the active brand win-state (`primary`); `completed` is `success`.
 * Pure + exported for unit testing.
 */
export type ChipRole = 'success' | 'warning' | 'danger' | 'muted' | 'primary'

export function statusRole(status: BookingStatus): ChipRole {
  switch (status) {
    case 'reserved':
    case 'vehicle-prepared':
      return 'warning'
    case 'confirmed':
      return 'success'
    case 'picked-up':
      return 'primary'
    case 'returned':
      return 'muted'
    case 'completed':
      return 'success'
    case 'rejected':
    case 'cancelled':
      return 'danger'
  }
}

/** Resolve a chip role to a themed color (kept separate so the mapping is testable). */
export function roleColor(theme: Theme, role: ChipRole): string {
  switch (role) {
    case 'success':
      return theme.color.success
    case 'warning':
      return theme.color.warning
    case 'danger':
      return theme.color.danger
    case 'primary':
      return theme.color.primary
    case 'muted':
      return theme.color.textMuted
  }
}

/**
 * Filled-tint background for a chip: the role color at a low alpha, except `muted`
 * which sits on the neutral surfaceAlt tile (no colored fill). Mirrors the mockup's
 * `.chip--*` rules. Exported so the same recipe can back any chip-styled element.
 */
export function roleFill(theme: Theme, role: ChipRole): string {
  if (role === 'muted') return theme.color.surfaceAlt
  return hexToTint(roleColor(theme, role), CHIP_FILL_ALPHA)
}

/** Chip tint strength — matches the mockup's `rgba(...,0.14)` fills. */
const CHIP_FILL_ALPHA = 0.14
/** Leading status dot diameter (one-off glyph dimension). */
const CHIP_DOT_SIZE = 6

/** #RGB / #RRGGBB → rgba() at the given alpha; non-hex falls back to itself. */
function hexToTint(hex: string, alpha: number): string {
  const m = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(hex.trim())
  if (!m) return hex
  const raw = m[1] ?? ''
  const h = raw.length === 3 ? raw.replace(/./g, (c) => c + c) : raw
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

interface Props {
  status: BookingStatus
  /** Localized label; the raw enum never renders to the user. */
  label: string
}

/**
 * Booking-lifecycle chip. Color + label animate on status change (keyed
 * AnimatePresence cross-fade) so a live status push reads as a transition, not a
 * flicker. Filled-tint style (no border) with a leading colored dot — matches the
 * Midnight GT mockup's `.chip`.
 */
export function StatusChip({ status, label }: Props) {
  const theme = useTheme()
  const m = useMotion()
  const role = statusRole(status)
  const color = roleColor(theme, role)
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={status}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={m.standard}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: theme.spacing.xs,
          color,
          background: roleFill(theme, role),
          border: 'none',
          borderRadius: theme.radius.pill,
          padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
          fontSize: theme.typography.caption.fontSize,
          fontWeight: theme.typography.label.fontWeight,
          textTransform: 'capitalize',
          whiteSpace: 'nowrap',
        }}
      >
        <span
          aria-hidden
          style={{
            width: CHIP_DOT_SIZE,
            height: CHIP_DOT_SIZE,
            borderRadius: theme.radius.pill,
            background: 'currentColor',
            flexShrink: 0,
          }}
        />
        {label}
      </motion.span>
    </AnimatePresence>
  )
}
