import 'i18next'
import type en from './locales/en.json'

// Type `t()` against the EN catalog so a missing/typo'd key is a compile error.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: {
      translation: typeof en
    }
  }
}
