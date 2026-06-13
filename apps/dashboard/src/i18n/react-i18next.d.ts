import 'react-i18next'
import type en from './locales/en.json'

// Typed `t()` — keys are checked against the EN catalog (the source of truth);
// a missing/renamed key is a compile error rather than a silent runtime fallback.
declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: {
      translation: typeof en
    }
  }
}
