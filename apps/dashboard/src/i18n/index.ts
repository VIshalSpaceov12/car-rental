import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import ar from './locales/ar.json'

export const RTL_LOCALES = ['ar'] as const
export type Locale = 'en' | 'ar'

const resources = {
  en: { translation: en },
  ar: { translation: ar },
} as const

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
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  })
  .then(() => applyDocumentDirection(i18n.language))

i18n.on('languageChanged', applyDocumentDirection)

export default i18n
