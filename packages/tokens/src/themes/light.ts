import type { ColorScheme } from '../theme'
import { palette, alpha } from '../primitives'

/**
 * Light scheme — the "Electric Aurora" admin look used by the dashboard: a
 * violet→cyan brand on indigo-navy, violet-tinted neutrals, with a neon violet
 * glow. Distinct from the dark app brand (racing red) by design — the dashboard
 * is the only consumer of this scheme. Layout primitives stay shared (reskin ≠
 * relayout); white-label still overrides `primary` per provider at runtime.
 */
export const lightScheme: ColorScheme = {
  primary: palette.violet[500],
  primaryDark: palette.violet[600],
  onPrimary: palette.neutral.white,
  accent: palette.cyan[500],

  background: palette.neutral.white,
  surface: palette.indigo[50],
  surfaceAlt: palette.indigo[100],

  text: palette.indigo[900],
  textMuted: palette.indigo[600],
  textSubtle: palette.indigo[400],

  border: palette.indigo[200],

  danger: palette.rose[500],
  success: palette.teal[400],
  warning: palette.gold[500],

  overlay: alpha.scrimAuroraAdmin,

  gradientPrimary: [palette.violet[500], palette.cyan[500]],
  glow: 'rgba(124,92,255,0.25)',
}
