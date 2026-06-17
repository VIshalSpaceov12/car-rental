import type { Theme } from '@car-rental/tokens'
import type { BookingStatus } from '@car-rental/types'

/** Semantic color role for a booking status (independent of the active theme). */
export type StatusColorRole = 'warning' | 'success' | 'primary' | 'textMuted' | 'danger'

/**
 * Booking-lifecycle status → semantic color role (one UI vocabulary, shared with
 * the dashboard's chip mapping). Pure (no theme) so it's unit testable.
 * `picked-up` reads `primary` (an active, in-progress rental); `completed` reads
 * `success` (a finished trip is a positive outcome).
 */
export function statusColorRole(status: BookingStatus): StatusColorRole {
  switch (status) {
    case 'reserved':
    case 'vehicle-prepared':
      return 'warning'
    case 'confirmed':
    case 'completed':
      return 'success'
    case 'picked-up':
      return 'primary'
    case 'returned':
      return 'textMuted'
    case 'rejected':
    case 'cancelled':
      return 'danger'
  }
}

/** Resolve the status role against the active theme's color scheme. */
export function statusColor(theme: Theme, status: BookingStatus): string {
  return theme.color[statusColorRole(status)]
}

/** Soft tint behind a status chip — the status' role color at ~0.14 alpha. */
const TINT_ALPHA = 0.14

/**
 * Convert a `#RGB`/`#RRGGBB` token color to an `rgba()` at the given alpha.
 * The role colors resolve from the theme (never raw literals), so a brand
 * override automatically retints the chip. Falls back to a neutral tint for a
 * non-hex token so a malformed override still renders.
 */
function hexToRgba(hex: string, alpha: number): string {
  const m = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(hex.trim())
  if (!m) return `rgba(0,0,0,${alpha})`
  const raw = m[1] ?? ''
  const h = raw.length === 3 ? raw.replace(/./g, (c) => c + c) : raw
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

/** Translucent background tint for a status chip (role color at ~0.14 alpha). */
export function statusTint(theme: Theme, status: BookingStatus): string {
  return hexToRgba(statusColor(theme, status), TINT_ALPHA)
}
