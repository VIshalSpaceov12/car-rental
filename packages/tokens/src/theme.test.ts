import { describe, it, expect } from 'vitest'
import { createTheme, darkTheme, lightTheme, defaultTheme, type ColorScheme } from './theme'

const COLOR_ROLES: (keyof ColorScheme)[] = [
  'primary', 'primaryDark', 'onPrimary',
  'background', 'surface', 'surfaceAlt',
  'text', 'textMuted', 'textSubtle',
  'border', 'danger', 'success', 'warning', 'overlay',
]

describe('@car-rental/tokens', () => {
  it('defaultTheme is the dark scheme (brand-first)', () => {
    expect(defaultTheme).toBe(darkTheme)
    expect(defaultTheme.color.background).toBe('#0A0A0B')
    expect(defaultTheme.color.primary).toBe('#E5322B')
  })

  it('every scheme fills every semantic color role', () => {
    for (const theme of [darkTheme, lightTheme]) {
      for (const role of COLOR_ROLES) {
        expect(theme.color[role], role).toBeTruthy()
      }
    }
  })

  it('shares static layout tokens across schemes (reskin ≠ relayout)', () => {
    expect(lightTheme.spacing).toBe(darkTheme.spacing)
    expect(lightTheme.radius).toBe(darkTheme.radius)
    expect(lightTheme.typography).toBe(darkTheme.typography)
    expect(darkTheme.color.primary).toBe(lightTheme.color.primary)
  })

  it('exposes the expanded scale used by composed components', () => {
    expect(typeof defaultTheme.spacing.xxl).toBe('number')
    expect(defaultTheme.radius.pill).toBe(999)
    expect(defaultTheme.typography.display.fontWeight).toBe('800')
    expect(defaultTheme.typography.heading.fontWeight).toBe('700')
    expect(defaultTheme.zIndex.modal).toBeGreaterThan(defaultTheme.zIndex.header)
    expect(defaultTheme.elevation.lg.elevation).toBeGreaterThan(defaultTheme.elevation.sm.elevation)
  })

  it('exposes a static sizing scale (so components never inline raw px) shared across schemes', () => {
    expect(defaultTheme.size.touchTarget).toBeGreaterThanOrEqual(44)
    expect(defaultTheme.size.icon.md).toBe(18)
    expect(defaultTheme.size.control.md).toBe(52)
    expect(lightTheme.size).toBe(darkTheme.size)
  })

  it('applies per-provider brand overrides without disturbing the rest of the scheme', () => {
    const branded = createTheme(darkTheme.color, { primary: '#00AA88' })
    expect(branded.color.primary).toBe('#00AA88')
    // untouched roles + static tokens still come from the base scheme
    expect(branded.color.background).toBe(darkTheme.color.background)
    expect(branded.color.onPrimary).toBe(darkTheme.color.onPrimary)
    expect(branded.spacing).toBe(darkTheme.spacing)
  })
})
