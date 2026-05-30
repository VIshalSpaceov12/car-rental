// Public surface: semantic theme + the contract type + the React provider/hook.
// The primitive scale (primitives.ts) is intentionally NOT re-exported.
export { defaultTheme, type Theme, type TextStyle, type FontWeight } from './theme'
export { ThemeProvider, useTheme } from './ThemeProvider'
