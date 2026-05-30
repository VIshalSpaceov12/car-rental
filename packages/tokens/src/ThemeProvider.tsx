import { createContext, useContext, type ReactNode } from 'react'
import { defaultTheme, type Theme } from './theme'

const ThemeContext = createContext<Theme>(defaultTheme)

/**
 * Provide the active provider theme at the app root. Resolve tokens via
 * `useTheme()` — never import color tokens directly, so one binary serves
 * many white-label brands.
 */
export function ThemeProvider({
  theme = defaultTheme,
  children,
}: {
  theme?: Theme
  children: ReactNode
}) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
}

export function useTheme(): Theme {
  return useContext(ThemeContext)
}
