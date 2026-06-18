import { describe, it, expect } from 'vitest'
import { lightTheme } from '@car-rental/tokens'
import { resolveTheme } from './App'

describe('resolveTheme — fixed Electric Aurora admin theme', () => {
  it('returns the Aurora light scheme', () => {
    const t = resolveTheme()
    expect(t).toBe(lightTheme)
    expect(t.color.primary).toBe('#7C5CFF')
    expect(t.color.gradientPrimary).toEqual(['#7C5CFF', '#22D3EE'])
  })

  it('keeps a legible light admin canvas (white bg, dark ink)', () => {
    const t = resolveTheme()
    expect(t.color.background).toBe('#FFFFFF')
    expect(t.color.text.toLowerCase()).not.toBe(t.color.background.toLowerCase())
  })

  it('does NOT recolor per provider — the admin chrome is constant across tenants', () => {
    // resolveTheme takes no branding: a provider's white-label brand drives the
    // customer mobile app + the dashboard logo/name, never the admin palette.
    expect(resolveTheme().color.primary).toBe(lightTheme.color.primary)
  })
})
