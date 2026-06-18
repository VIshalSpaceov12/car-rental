import type { ColorScheme } from '../theme'
import { palette, alpha } from '../primitives'

/**
 * Minimal — the customer mobile app scheme, now the "Electric Aurora" dark look:
 * a violet→cyan brand on indigo-navy near-black surfaces, near-white text, a neon
 * violet glow, teal success / rose danger. The mobile app renders this as a fixed
 * identity (see `apps/mobile/App.tsx`); layout primitives stay shared.
 */
export const minimalScheme: ColorScheme = {
  primary: palette.violet[500],
  primaryDark: palette.violet[600],
  onPrimary: palette.neutral.white,
  accent: palette.cyan[500],

  background: palette.auroraDark.canvas,
  surface: palette.auroraDark.surface,
  surfaceAlt: palette.auroraDark.surfaceAlt,

  text: palette.auroraDark.text,
  textMuted: palette.auroraDark.textMuted,
  textSubtle: palette.auroraDark.textSubtle,

  border: palette.auroraDark.border,

  danger: palette.rose[500],
  success: palette.teal[400],
  warning: palette.gold[500],

  overlay: alpha.scrimAuroraDark,

  gradientPrimary: [palette.violet[500], palette.cyan[500]],
  glow: 'rgba(124,92,255,0.45)',
}
