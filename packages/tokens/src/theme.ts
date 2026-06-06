import { palette, space, fontFamily } from './primitives'

export type FontWeight = '400' | '500' | '600' | '700'

export interface TextStyle {
  fontFamily: string
  fontSize: number
  fontWeight: FontWeight
  lineHeight: number
}

/**
 * Semantic token contract. Every provider theme must satisfy `Theme`, so a
 * missing role (e.g. `color.danger`) is a compile error, not a runtime blank.
 *
 * Split is intentional: `spacing`/`radius`/`typography` are layout primitives
 * (static across brands); `color` is themeable (reskinned per provider).
 */
export interface Theme {
  color: {
    primary: string
    primaryDark: string
    onPrimary: string
    background: string
    surface: string
    text: string
    textMuted: string
    danger: string
    success: string
  }
  spacing: {
    none: number
    xs: number
    sm: number
    md: number
    lg: number
    xl: number
  }
  radius: {
    sm: number
    md: number
    card: number
  }
  typography: {
    body: TextStyle
    heading: TextStyle
  }
}

export const defaultTheme: Theme = {
  color: {
    primary: palette.blue500,
    primaryDark: palette.blue600,
    onPrimary: palette.white,
    background: palette.white,
    surface: palette.gray100,
    text: palette.gray900,
    textMuted: palette.gray700,
    danger: palette.red500,
    success: palette.green500,
  },
  spacing: {
    none: space[0],
    xs: space[1],
    sm: space[2],
    md: space[4],
    lg: space[5],
    xl: space[6],
  },
  radius: {
    sm: 4,
    md: 8,
    card: 12,
  },
  typography: {
    body: { fontFamily: fontFamily.base, fontSize: 16, fontWeight: '400', lineHeight: 24 },
    heading: { fontFamily: fontFamily.base, fontSize: 24, fontWeight: '700', lineHeight: 32 },
  },
}
