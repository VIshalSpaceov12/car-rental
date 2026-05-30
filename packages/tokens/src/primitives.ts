/**
 * PRIVATE primitive scale. Not exported from the package index — components
 * must never touch these directly. The semantic layer (theme.ts) maps them to
 * roles, so a per-provider theme can reskin a role without touching the scale.
 */
export const palette = {
  blue500: '#2563eb',
  blue600: '#1d4ed8',
  gray900: '#0f172a',
  gray700: '#334155',
  gray100: '#f1f5f9',
  white: '#ffffff',
  red500: '#ef4444',
  green500: '#22c55e',
} as const

/** Spacing scale in px/dp; indexed by the semantic spacing map. */
export const space = [0, 4, 8, 12, 16, 24, 32, 48] as const

export const fontFamily = {
  /** Platform default; a provider theme can override per white-label brand. */
  base: 'System',
} as const
