import type { ColorScheme } from '../theme'
import { palette, alpha } from '../primitives'

/**
 * Light scheme — sibling of dark with the same racing-red brand. Used by the
 * dashboard (data-dense admin) and available for a light mode on mobile.
 * Only the neutrals flip; brand + status hues stay identical across schemes.
 */
export const lightScheme: ColorScheme = {
  primary: palette.red[500],
  primaryDark: palette.red[600],
  onPrimary: palette.neutral.white,

  background: palette.neutral.white,
  surface: palette.neutral[50],
  surfaceAlt: palette.neutral[100],

  text: palette.neutral[900],
  textMuted: palette.neutral[500],
  textSubtle: palette.neutral[400],

  border: palette.neutral[200],

  danger: palette.alert[500],
  success: palette.green[500],
  warning: palette.gold[500],

  overlay: alpha.scrimLight,
}
