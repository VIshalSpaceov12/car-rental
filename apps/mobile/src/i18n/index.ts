import { I18nManager } from 'react-native'
import { getLocales } from 'expo-localization'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { Locale } from '@car-rental/types'
import { loadLocale, saveLocale } from '../storage/localeStorage'
import en from './locales/en.json'
import ar from './locales/ar.json'

export const SUPPORTED_LOCALES = ['en', 'ar'] as const
const FALLBACK_LOCALE: Locale = 'en'

/** Device language narrowed to a supported app locale (defaults to EN). */
function deviceLocale(): Locale {
  const code = getLocales()[0]?.languageCode
  return (SUPPORTED_LOCALES as readonly string[]).includes(code ?? '') ? (code as Locale) : FALLBACK_LOCALE
}

/** Align native layout direction with the active locale (Arabic is RTL). */
function applyDirection(locale: Locale) {
  // Arabic is RTL: allow the locale to drive layout direction (logical props handle
  // the rest). Force LTR for the others so a previous RTL session doesn't stick.
  I18nManager.allowRTL(true)
  I18nManager.forceRTL(locale === 'ar')
}

const initialLocale = deviceLocale()
applyDirection(initialLocale)

// Synchronous init keeps i18n ready before first render; the persisted choice is
// applied right after startup via `initLocaleFromStorage()` (SecureStore is async).
void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: initialLocale,
  fallbackLng: FALLBACK_LOCALE,
  interpolation: { escapeValue: false },
  returnNull: false,
})

/**
 * On startup, override the device-derived locale with the user's persisted
 * choice (if any). Resolution order: persisted → device → EN.
 */
export async function initLocaleFromStorage(): Promise<void> {
  const stored = await loadLocale()
  if (stored && stored !== i18n.language) {
    applyDirection(stored)
    await i18n.changeLanguage(stored)
  }
}

/**
 * Switch the UI language at runtime: update strings immediately and persist the
 * choice. Returns whether the RTL-ness changed — RN only applies `forceRTL`
 * after a reload, so callers should prompt for a restart when this is `true`.
 */
export async function setLocale(locale: Locale): Promise<{ directionChanged: boolean }> {
  const directionChanged = (locale === 'ar') !== I18nManager.isRTL
  await i18n.changeLanguage(locale)
  await saveLocale(locale)
  applyDirection(locale)
  return { directionChanged }
}

export default i18n
