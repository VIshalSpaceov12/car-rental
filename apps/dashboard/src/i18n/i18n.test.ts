import { describe, it, expect } from 'vitest'
import i18n from './index'
import en from './locales/en.json'
import ar from './locales/ar.json'

/** Flatten a nested catalog to dotted key paths. */
function keyPaths(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? keyPaths(v as Record<string, unknown>, `${prefix}${k}.`)
      : [`${prefix}${k}`],
  )
}

describe('i18n catalogs', () => {
  it('EN and AR have identical key structures', () => {
    expect(keyPaths(ar).sort()).toEqual(keyPaths(en).sort())
  })

  it('initializes and resolves keys via t() (incl. interpolation)', () => {
    expect(i18n.isInitialized).toBe(true)
    expect(i18n.t('common.save')).toBe('Save')
    expect(i18n.t('overview.welcome', { name: 'Sam', role: 'service-provider' })).toBe(
      'Welcome, Sam (service-provider)',
    )
  })
})
