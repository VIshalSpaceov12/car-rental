/**
 * PRIVATE primitive scales. Never exported from the package index — components
 * and apps must not touch these directly. The semantic layer (themes/*.ts) maps
 * them to roles, so a per-brand or light/dark scheme reskins a role without
 * touching the scale. Values are raw; meaning lives in the semantic layer.
 */

/** Neutral ramp, dark→light. Anchors the surfaces + text of every scheme. */
const neutral = {
  black: '#000000',
  950: '#08080A',
  900: '#121214',
  850: '#141417',
  800: '#1C1C21',
  700: '#2A2A30',
  600: '#3A3A40',
  500: '#55555C',
  450: '#6E6E76',
  400: '#76767E',
  350: '#8A8A92',
  300: '#9A9AA2',
  200: '#C9C9CF',
  100: '#ECECEF',
  50: '#F5F5F7',
  white: '#FFFFFF',
} as const

/** Racing red — the brand accent (FABs, active states, prices, the red 930). */
const red = {
  700: '#B71C16',
  600: '#D42E26',
  500: '#FF453A',
  450: '#FF3B30',
  400: '#FF4A40',
} as const

/** Ember — the warm start stop of the brand gradient (ember→red). */
const ember = {
  500: '#FF8A3D',
} as const

/** Gold — rating stars. */
const gold = {
  500: '#FBBF24',
} as const

/** Status hues kept distinct from brand red so lifecycle state reads clearly. */
const green = {
  500: '#34D399',
} as const

const alert = {
  500: '#FF453A',
} as const

/** Teal — secondary accent. `500` = minimal customer accent; `400` = brighter Aurora success. */
const teal = {
  400: '#2DD4BF',
  500: '#13B5A6',
} as const

// ── Electric Aurora scales — consumed only by the light (admin/dashboard) scheme.
// A violet→cyan brand on indigo-navy neutrals; mobile's dark/minimal don't touch these.
/** Violet — Aurora brand. `500` primary, `600` the deep stop. */
const violet = {
  600: '#5B3FD6',
  500: '#7C5CFF',
} as const

/** Cyan — the Aurora gradient end stop + secondary accent. */
const cyan = {
  500: '#22D3EE',
} as const

/** Rose — Aurora danger (softer than racing red on a light canvas). */
const rose = {
  500: '#FB7185',
} as const

/** Indigo-navy, violet-tinted neutrals — surfaces + text of the Aurora admin (light) scheme. */
const indigo = {
  900: '#14152B', // ink — primary text
  600: '#5A5C7A', // muted text
  400: '#9799B5', // subtle text / meta
  200: '#D8D9EC', // hairline border
  100: '#EAEAF6', // raised tile / surfaceAlt
  50: '#F4F4FB', // card surface
} as const

/** Electric Aurora DARK neutrals — surfaces + text of the customer mobile (dark) scheme. */
const auroraDark = {
  canvas: '#0A0B1A', // app background
  surface: '#15162B', // card
  surfaceAlt: '#1E2040', // raised tile / input
  border: '#2A2C4F', // dividers
  text: '#F4F5FF', // primary text (violet-tinted near-white)
  textMuted: '#A6A8C8', // secondary text
  textSubtle: '#6E708F', // meta text
} as const

export const palette = { neutral, red, ember, gold, green, alert, teal, violet, cyan, rose, indigo, auroraDark } as const

/**
 * Translucent layers (photo scrims over hero/cards). Both are black; the
 * `Dark`/`Light` suffix is the *opacity strength* (which scheme consumes it as
 * `overlay`), not the scrim's color.
 */
export const alpha = {
  scrimDark: 'rgba(0,0,0,0.55)',
  scrimLight: 'rgba(0,0,0,0.45)',
  /** Lighter scrim for the light admin scheme (toast/modal backdrops). */
  scrimLightAdmin: 'rgba(0,0,0,0.25)',
  /** Indigo-navy scrim for the Electric Aurora admin scheme. */
  scrimAuroraAdmin: 'rgba(20,21,43,0.45)',
  /** Deep indigo scrim for the Electric Aurora dark (mobile) scheme. */
  scrimAuroraDark: 'rgba(8,9,24,0.6)',
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
export const radii = { sm: 10, md: 16, lg: 24, xl: 32, pill: 999 } as const

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
