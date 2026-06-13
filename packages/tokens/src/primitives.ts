/**
 * PRIVATE primitive scales. Never exported from the package index — components
 * and apps must not touch these directly. The semantic layer (themes/*.ts) maps
 * them to roles, so a per-brand or light/dark scheme reskins a role without
 * touching the scale. Values are raw; meaning lives in the semantic layer.
 */

/** Neutral ramp, dark→light. Anchors the surfaces + text of every scheme. */
const neutral = {
  black: '#000000',
  950: '#0A0A0B',
  900: '#121214',
  850: '#161618',
  800: '#1F1F22',
  700: '#2A2A2E',
  600: '#3A3A40',
  500: '#55555C',
  400: '#76767E',
  300: '#9A9AA2',
  200: '#C9C9CF',
  100: '#ECECEF',
  50: '#F5F5F7',
  white: '#FFFFFF',
} as const

/** Racing red — the brand accent (FABs, active states, prices, the red 930). */
const red = {
  700: '#B71C16',
  600: '#C9261E',
  500: '#E5322B',
  400: '#FF4A40',
} as const

/** Gold — rating stars. */
const gold = {
  500: '#FFBF3F',
} as const

/** Status hues kept distinct from brand red so lifecycle state reads clearly. */
const green = {
  500: '#32C36A',
} as const

const alert = {
  500: '#FF4438',
} as const

export const palette = { neutral, red, gold, green, alert } as const

/**
 * Translucent layers (photo scrims over hero/cards). Both are black; the
 * `Dark`/`Light` suffix is the *opacity strength* (which scheme consumes it as
 * `overlay`), not the scrim's color.
 */
export const alpha = {
  scrimDark: 'rgba(0,0,0,0.55)',
  scrimLight: 'rgba(0,0,0,0.45)',
} as const

/**
 * Sizing primitives in px/dp — cross-component dimensions (icon glyphs, circular
 * controls/FABs, min tap target) so components never inline a raw width/size.
 * One-off layout dimensions (a specific card height) stay as named module consts
 * in the component, not here.
 */
export const sizing = {
  icon: { xs: 14, sm: 16, md: 18, lg: 20, xl: 22, xxl: 24, hero: 32 },
  control: { sm: 40, md: 52, lg: 60 },
  touchTarget: 44,
} as const

/** Spacing scale in px/dp; indexed by the semantic spacing map. */
export const space = [0, 4, 8, 12, 16, 24, 32, 48] as const

/** Corner radii in px/dp; `999` reads as a pill/circle. */
export const radii = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 } as const

/** Type scale primitives — font sizes + line heights paired by role. */
export const fontSize = {
  display: 56,
  heading: 28,
  title: 20,
  subtitle: 15,
  body: 16,
  caption: 13,
  label: 13,
} as const

export const fontFamily = {
  /** Platform default; a brand scheme can override for white-label type. */
  base: 'System',
} as const
