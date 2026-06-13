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
  it('AR stub mirrors the EN key structure exactly', () => {
    expect(keyPaths(ar).sort()).toEqual(keyPaths(en).sort())
  })

  it('initializes and resolves keys via t() (incl. interpolation)', () => {
    expect(i18n.isInitialized).toBe(true)
    expect(i18n.t('common.done')).toBe('Done')
    expect(i18n.t('browse.greeting', { name: 'Sam' })).toBe('Hello, Sam')
  })
})
