import { describe, it, expect } from 'vitest'
import { createTheme, darkTheme, lightTheme, minimalTheme, defaultTheme, type ColorScheme } from './theme'

const COLOR_ROLES: (keyof ColorScheme)[] = [
  'primary', 'primaryDark', 'onPrimary', 'accent',
  'background', 'surface', 'surfaceAlt',
  'text', 'textMuted', 'textSubtle',
  'border', 'danger', 'success', 'warning', 'overlay',
  'gradientPrimary', 'glow',
]

const ALL_THEMES = [darkTheme, lightTheme, minimalTheme]

describe('@car-rental/tokens', () => {
  it('defaultTheme is the dark scheme (brand-first)', () => {
    expect(defaultTheme).toBe(darkTheme)
    expect(defaultTheme.color.background).toBe('#08080A')
    expect(defaultTheme.color.primary).toBe('#FF453A')
  })

  it('every scheme fills every semantic color role', () => {
    for (const theme of ALL_THEMES) {
      for (const role of COLOR_ROLES) {
        expect(theme.color[role], role).toBeTruthy()
      }
    }
  })

  it('the minimal scheme is the Electric Aurora dark customer theme', () => {
    expect(minimalTheme.color.background).toBe('#0A0B1A')
    expect(minimalTheme.color.surface).toBe('#15162B')
    expect(minimalTheme.color.primary).toBe('#7C5CFF')
    expect(minimalTheme.color.accent).toBe('#22D3EE')
    expect(minimalTheme.color.gradientPrimary).toEqual(['#7C5CFF', '#22D3EE'])
    // shares the static layout tokens (reskin ≠ relayout)
    expect(minimalTheme.spacing).toBe(darkTheme.spacing)
    expect(minimalTheme.motion).toBe(darkTheme.motion)
  })

  it('shares static layout tokens across schemes (reskin ≠ relayout)', () => {
    expect(lightTheme.spacing).toBe(darkTheme.spacing)
    expect(lightTheme.radius).toBe(darkTheme.radius)
    expect(lightTheme.typography).toBe(darkTheme.typography)
  })

  it('the light scheme is the Electric Aurora admin theme (distinct violet→cyan brand)', () => {
    expect(lightTheme.color.primary).toBe('#7C5CFF')
    expect(lightTheme.color.background).toBe('#FFFFFF')
    expect(lightTheme.color.text).toBe('#14152B')
    expect(lightTheme.color.gradientPrimary).toEqual(['#7C5CFF', '#22D3EE'])
    // intentionally a different brand hue than the dark app scheme (red)
    expect(lightTheme.color.primary).not.toBe(darkTheme.color.primary)
    // reskin ≠ relayout — static tokens still shared with dark
    expect(lightTheme.spacing).toBe(darkTheme.spacing)
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

  it('every scheme carries an accent gradient (2-tuple of strings) + glow string', () => {
    for (const theme of [darkTheme, lightTheme]) {
      const g = theme.color.gradientPrimary
      expect(Array.isArray(g)).toBe(true)
      expect(g).toHaveLength(2)
      expect(typeof g[0]).toBe('string')
      expect(typeof g[1]).toBe('string')
      expect(typeof theme.color.glow).toBe('string')
    }
  })

  it('exposes a static motion group (durations ms, easing tuples, press spring)', () => {
    const m = defaultTheme.motion
    expect(Object.keys(m.duration).sort()).toEqual(['base', 'fast', 'hero', 'slow'])
    expect(m.duration.fast).toBe(120)
    expect(m.duration.hero).toBe(480)
    expect(Object.keys(m.easing).sort()).toEqual(['enter', 'exit', 'spring', 'standard'])
    expect(m.easing.standard).toHaveLength(4)
    expect(m.easing.spring).toHaveLength(4)
    expect(m.spring.press.damping).toBe(18)
    expect(m.spring.press.stiffness).toBe(240)
    expect(m.spring.press.mass).toBe(0.8)
    // motion is static — shared identity across schemes
    expect(lightTheme.motion).toBe(darkTheme.motion)
  })

  it('derives gradientPrimary + glow from a partial brand override that omits them', () => {
    const branded = createTheme(darkTheme.color, { primary: '#123456' })
    expect(branded.color.gradientPrimary[0]).toBe('#123456')
    expect(branded.color.gradientPrimary[1]).toBe(darkTheme.color.primaryDark)
    expect(branded.color.glow).toBe('rgba(18,52,86,0.35)')
    // base scheme keeps its hand-picked values (no mutation leak)
    expect(darkTheme.color.gradientPrimary).toEqual(['#FF8A3D', '#FF3B30'])
    expect(darkTheme.color.glow).toBe('rgba(255,69,58,0.35)')
  })

  it('keeps an explicit gradient/glow override instead of deriving', () => {
    const branded = createTheme(darkTheme.color, {
      primary: '#123456',
      gradientPrimary: ['#AAA', '#BBB'],
      glow: 'rgba(1,2,3,0.5)',
    })
    expect(branded.color.gradientPrimary).toEqual(['#AAA', '#BBB'])
    expect(branded.color.glow).toBe('rgba(1,2,3,0.5)')
  })
})
