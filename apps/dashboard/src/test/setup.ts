import '@testing-library/jest-dom'
// Initialize i18next once for the suite so components rendering `useTranslation`
// resolve real EN copy (tests assert on visible labels, not raw keys).
import '../i18n'
