// Public surface: the theme contract types, the assembled themes, and the React
// provider/hook. The primitive scale (primitives.ts) and raw schemes stay
// internal — apps consume only semantic tokens via `useTheme()`.
export {
  createTheme,
  darkTheme,
  lightTheme,
  minimalTheme,
  defaultTheme,
  type Theme,
  type ColorScheme,
  type TextStyle,
  type FontWeight,
  type ElevationStyle,
} from './theme'
export { ThemeProvider, useTheme } from './ThemeProvider'
