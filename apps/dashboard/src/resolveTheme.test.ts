import { describe, it, expect } from 'vitest'
import type { ProviderBranding } from '@car-rental/types'
import { resolveTheme } from './App'

const branding = (colors: ProviderBranding['colors']): ProviderBranding => ({
  name: 'Demo',
  logoUrl: null,
  colors,
})

describe('resolveTheme — white-label contrast', () => {
  it('keeps the admin canvas on the light scheme even for a dark mobile-brand background', () => {
    // The seeded demo provider ships background #0A0A0B — it must NOT repaint the
    // admin canvas dark and bury the light scheme's near-black text.
    const t = resolveTheme(branding({ primary: '#E5322B', primaryDark: '#C9261E', background: '#0A0A0B' }))
    expect(t.color.background.toLowerCase()).not.toBe('#0a0a0b') // ignored on the dashboard
    expect(t.color.text.toLowerCase()).not.toBe(t.color.background.toLowerCase()) // legible
  })

  it('applies the provider primary hue', () => {
    const t = resolveTheme(branding({ primary: '#0B5', background: '#FFFFFF' }))
    expect(t.color.primary).toBe('#0B5')
  })

  it('onPrimary flips to stay legible on a pale primary', () => {
    const pale = resolveTheme(branding({ primary: '#FFE08A' }))
    expect(pale.color.onPrimary).toBe('#121214')
    const deep = resolveTheme(branding({ primary: '#E5322B' }))
    expect(deep.color.onPrimary).toBe('#FFFFFF')
  })
})
