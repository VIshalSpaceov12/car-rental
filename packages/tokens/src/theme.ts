import { space, radii, fontSize, fontFamily, sizing } from './primitives'
import { darkScheme } from './themes/dark'
import { lightScheme } from './themes/light'

export type FontWeight = '300' | '400' | '500' | '600' | '700' | '800'

export interface TextStyle {
  fontFamily: string
  fontSize: number
  fontWeight: FontWeight
  lineHeight: number
  /** Optional tracking; display/hero type reads tighter. */
  letterSpacing?: number
}

/**
 * Framework-agnostic elevation. RN consumes these props directly; web maps them
 * to a `box-shadow` (elevation ≠ box-shadow, so each app applies in its idiom).
 */
export interface ElevationStyle {
  shadowColor: string
  shadowOpacity: number
  shadowRadius: number
  shadowOffset: { width: number; height: number }
  elevation: number
}

/**
 * THEMEABLE color contract. Every scheme (dark/light, or a white-label brand)
 * must satisfy `ColorScheme`, so a missing role (e.g. `warning`) is a compile
 * error, not a runtime blank. Names are semantic (role), never literal (`red500`).
 */
export interface ColorScheme {
  // brand
  primary: string
  primaryDark: string
  onPrimary: string
  // surfaces (canvas → card → raised tile/input)
  background: string
  surface: string
  surfaceAlt: string
  // text (primary → secondary → meta)
  text: string
  textMuted: string
  textSubtle: string
  // lines
  border: string
  // status
  danger: string
  success: string
  warning: string
  // photo scrims / modal backdrops
  overlay: string
  // accent gradient + glow (themeable; auto-derived from primary when a brand
  // override omits them)
  gradientPrimary: [string, string]
  glow: string
}

/**
 * Full theme = themeable `color` + STATIC layout primitives (spacing, radius,
 * typography, elevation, zIndex) that stay constant across brands, so a reskin
 * never disturbs layout.
 */
export interface Theme {
  color: ColorScheme
  spacing: {
    none: number
    xs: number
    sm: number
    md: number
    lg: number
    xl: number
    xxl: number
  }
  radius: {
    sm: number
    md: number
    lg: number
    xl: number
    /** Default card radius (alias of `lg`); kept as a role for composed cards. */
    card: number
    pill: number
  }
  typography: {
    display: TextStyle
    heading: TextStyle
    title: TextStyle
    subtitle: TextStyle
    body: TextStyle
    caption: TextStyle
    label: TextStyle
  }
  elevation: {
    none: ElevationStyle
    sm: ElevationStyle
    md: ElevationStyle
    lg: ElevationStyle
  }
  zIndex: {
    base: number
    card: number
    header: number
    overlay: number
    modal: number
    toast: number
  }
  /**
   * Static sizing scale for cross-component dimensions (icon glyphs, circular
   * controls, min tap target). Components resolve these instead of inlining a
   * raw px value; one-off layout dimensions live as named consts in the component.
   */
  size: {
    icon: { xs: number; sm: number; md: number; lg: number; xl: number; xxl: number; hero: number }
    control: { sm: number; md: number; lg: number }
    touchTarget: number
  }
  /**
   * Static motion group — durations (ms), cubic-bezier easing tuples, and a
   * press spring. Shared across schemes (motion is layout, not brand). Web maps
   * easing via `cubic-bezier(...)`; RN via `Easing.bezier(...)` / `withSpring`.
   */
  motion: {
    duration: { fast: number; base: number; slow: number; hero: number }
    easing: {
      standard: [number, number, number, number]
      enter: [number, number, number, number]
      exit: [number, number, number, number]
      /** Overshoot curve for press/FAB/tab-indicator/stagger bounce. */
      spring: [number, number, number, number]
    }
    spring: { press: { damping: number; stiffness: number; mass: number } }
  }
}

// ── Static layout tokens (shared by every scheme) ──────────────────────────

const spacing: Theme['spacing'] = {
  none: space[0],
  xs: space[1],
  sm: space[2],
  md: space[4],
  lg: space[5],
  xl: space[6],
  xxl: space[7],
}

const radius: Theme['radius'] = {
  sm: radii.sm,
  md: radii.md,
  lg: radii.lg,
  xl: radii.xl,
  card: radii.lg,
  pill: radii.pill,
}

const typography: Theme['typography'] = {
  display: { fontFamily: fontFamily.base, fontSize: fontSize.display, fontWeight: '800', lineHeight: 60, letterSpacing: -1 },
  heading: { fontFamily: fontFamily.base, fontSize: fontSize.heading, fontWeight: '700', lineHeight: 34 },
  title: { fontFamily: fontFamily.base, fontSize: fontSize.title, fontWeight: '600', lineHeight: 26 },
  subtitle: { fontFamily: fontFamily.base, fontSize: fontSize.subtitle, fontWeight: '500', lineHeight: 20 },
  body: { fontFamily: fontFamily.base, fontSize: fontSize.body, fontWeight: '400', lineHeight: 24 },
  caption: { fontFamily: fontFamily.base, fontSize: fontSize.caption, fontWeight: '400', lineHeight: 18 },
  label: { fontFamily: fontFamily.base, fontSize: fontSize.label, fontWeight: '600', lineHeight: 16 },
}

const elevation: Theme['elevation'] = {
  none: { shadowColor: '#000000', shadowOpacity: 0, shadowRadius: 0, shadowOffset: { width: 0, height: 0 }, elevation: 0 },
  sm: { shadowColor: '#000000', shadowOpacity: 0.18, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  md: { shadowColor: '#000000', shadowOpacity: 0.22, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  lg: { shadowColor: '#000000', shadowOpacity: 0.28, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 12 },
}

const zIndex: Theme['zIndex'] = {
  base: 0,
  card: 1,
  header: 10,
  overlay: 100,
  modal: 1000,
  toast: 2000,
}

const size: Theme['size'] = {
  icon: { ...sizing.icon },
  control: { ...sizing.control },
  touchTarget: sizing.touchTarget,
}

const motion: Theme['motion'] = {
  duration: { fast: 120, base: 200, slow: 320, hero: 480 },
  easing: {
    standard: [0.2, 0, 0, 1],
    enter: [0, 0, 0, 1],
    exit: [0.4, 0, 1, 1],
    spring: [0.34, 1.56, 0.64, 1],
  },
  spring: { press: { damping: 18, stiffness: 240, mass: 0.8 } },
}

/**
 * PRIVATE — convert a hex color to an `rgba()` string at the given alpha.
 * Handles `#RGB` and `#RRGGBB`; a non-hex input falls back to a neutral black
 * rgba so a malformed brand override still yields a usable glow string.
 */
function hexToRgba(hex: string, alpha: number): string {
  const m = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(hex.trim())
  if (!m) return `rgba(0,0,0,${alpha})`
  const raw = m[1] ?? ''
  const h =
    raw.length === 3
      ? raw.replace(/./g, (c) => c + c)
      : raw
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

/**
 * Assemble a full theme from a color scheme + the shared static tokens.
 * `brandOverrides` applies per-provider white-label colors on top of the scheme
 * (e.g. `createTheme(darkScheme, { primary: provider.colors.primary })`).
 */
export function createTheme(color: ColorScheme, brandOverrides?: Partial<ColorScheme>): Theme {
  const resolved: ColorScheme = brandOverrides ? { ...color, ...brandOverrides } : color
  // Derive accent gradient + glow from the resolved primary ONLY when the brand
  // override didn't set them, so the default schemes' hand-picked values survive.
  if (brandOverrides && brandOverrides.gradientPrimary === undefined) {
    resolved.gradientPrimary = [resolved.primary, resolved.primaryDark]
  }
  if (brandOverrides && brandOverrides.glow === undefined) {
    resolved.glow = hexToRgba(resolved.primary, 0.35)
  }
  return { color: resolved, spacing, radius, typography, elevation, zIndex, size, motion }
}

export const darkTheme: Theme = createTheme(darkScheme)
export const lightTheme: Theme = createTheme(lightScheme)

/** Brand default is dark-first (the reference design). */
export const defaultTheme: Theme = darkTheme
