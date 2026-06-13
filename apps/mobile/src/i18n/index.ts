import { I18nManager } from 'react-native'
import { getLocales } from 'expo-localization'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { Locale } from '@car-rental/types'
import en from './locales/en.json'
import ar from './locales/ar.json'

export const SUPPORTED_LOCALES = ['en', 'ar'] as const
const FALLBACK_LOCALE: Locale = 'en'

/** Device language narrowed to a supported app locale (defaults to EN). */
function deviceLocale(): Locale {
  const code = getLocales()[0]?.languageCode
  return (SUPPORTED_LOCALES as readonly string[]).includes(code ?? '') ? (code as Locale) : FALLBACK_LOCALE
}

const lng = deviceLocale()

// Arabic is RTL: allow the locale to drive layout direction (logical props handle
// the rest). Force LTR for the others so a previous RTL session doesn't stick.
I18nManager.allowRTL(true)
I18nManager.forceRTL(lng === 'ar')

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng,
  fallbackLng: FALLBACK_LOCALE,
  interpolation: { escapeValue: false },
  returnNull: false,
})

export default i18n
