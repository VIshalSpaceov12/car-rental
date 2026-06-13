import { useMemo } from 'react'
import { Provider } from 'react-redux'
import { ThemeProvider, createTheme, lightTheme, type Theme } from '@car-rental/tokens'
import type { ProviderBranding } from '@car-rental/types'
import './i18n'
import { store } from './store/store'
import { useAppSelector } from './store/hooks'
import { AuthScreen } from './features/auth/AuthScreen'
import { DashboardLayout } from './features/dashboard/DashboardLayout'

/**
 * Resolve the runtime theme from provider branding. The dashboard runs the light
 * scheme of the racing-red brand; per-provider white-label colors are layered on
 * top via `createTheme`. Before login (no branding) we use the base `lightTheme`.
 */
function resolveTheme(branding: ProviderBranding | null): Theme {
  if (!branding) return lightTheme
  return createTheme(lightTheme.color, {
    primary: branding.colors.primary,
    ...(branding.colors.primaryDark ? { primaryDark: branding.colors.primaryDark } : {}),
    ...(branding.colors.background ? { background: branding.colors.background } : {}),
  })
}

function Root() {
  const token = useAppSelector((s) => s.auth.token)
  return token ? <DashboardLayout /> : <AuthScreen />
}

function ThemedApp() {
  const branding = useAppSelector((s) => s.auth.branding)
  const theme = useMemo(() => resolveTheme(branding), [branding])
  return (
    <ThemeProvider theme={theme}>
      <Root />
    </ThemeProvider>
  )
}

export function App() {
  return (
    <Provider store={store}>
      <ThemedApp />
    </Provider>
  )
}
