import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import ar from './locales/ar.json'

export const RTL_LOCALES = ['ar'] as const
export type Locale = 'en' | 'ar'

const LOCALE_KEY = 'car_rental_locale'
const DEFAULT_LOCALE: Locale = 'en'

const resources = {
  en: { translation: en },
  ar: { translation: ar },
} as const

/** Read the persisted UI locale, falling back to the default when unset/invalid. */
export function loadPersistedLocale(): Locale {
  try {
    const saved = localStorage.getItem(LOCALE_KEY)
    return saved === 'en' || saved === 'ar' ? saved : DEFAULT_LOCALE
  } catch {
    return DEFAULT_LOCALE
  }
}

/** Switch the active UI language and persist the choice (no reload needed on web). */
export function setLocale(locale: Locale): void {
  try {
    localStorage.setItem(LOCALE_KEY, locale)
  } catch {
    // Non-fatal: a blocked localStorage just means the choice isn't remembered.
  }
  void i18n.changeLanguage(locale)
}

/**
 * Mirror the active locale onto the document so the whole dashboard is `dir`-aware
 * from the start (Arabic is RTL). Layout uses logical props, so flipping `dir` is
 * the only physical-direction switch the app needs. AR copy QA is Phase 7.
 */
export function applyDocumentDirection(locale: string): void {
  const dir = (RTL_LOCALES as readonly string[]).includes(locale) ? 'rtl' : 'ltr'
  document.documentElement.dir = dir
  document.documentElement.lang = locale
}

void i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: loadPersistedLocale(),
    fallbackLng: DEFAULT_LOCALE,
    interpolation: { escapeValue: false },
  })
  .then(() => applyDocumentDirection(i18n.language))

i18n.on('languageChanged', applyDocumentDirection)

export default i18n
