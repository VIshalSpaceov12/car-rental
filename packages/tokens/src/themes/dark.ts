import type { ColorScheme } from '../theme'
import { palette, alpha } from '../primitives'

/**
 * Dark scheme — the brand default, extracted from the reference design:
 * near-black canvas, layered grey cards/tiles, racing-red accents, white text,
 * gold rating stars.
 */
export const darkScheme: ColorScheme = {
  primary: palette.red[500],
  primaryDark: palette.red[600],
  onPrimary: palette.neutral.white,

  background: palette.neutral[950],
  surface: palette.neutral[850],
  surfaceAlt: palette.neutral[800],

  text: palette.neutral.white,
  textMuted: palette.neutral[300],
  textSubtle: palette.neutral[400],

  border: palette.neutral[700],

  danger: palette.alert[500],
  success: palette.green[500],
  warning: palette.gold[500],

  overlay: alpha.scrimDark,
}
