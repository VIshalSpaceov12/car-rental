import { useEffect } from 'react'
import { Provider } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { ThemeProvider, lightTheme, useTheme, type Theme } from '@car-rental/tokens'
import './i18n'
import { store } from './store/store'
import { useAppDispatch, useAppSelector } from './store/hooks'
import { useMeQuery } from './store/authApi'
import { logout, setBranding } from './store/authSlice'
import { AuthScreen } from './features/auth/AuthScreen'
import { DashboardLayout } from './features/dashboard/DashboardLayout'
import { ToastProvider } from './components/Toast'

/**
 * The admin dashboard renders a FIXED "Electric Aurora" identity (the light
 * scheme — see `light.ts`), the same for every tenant. White-label is deliberately
 * NOT applied to the admin chrome's colors: per-provider hue recoloring was dropped
 * so staff get one consistent tool across tenants. Branding still drives the
 * customer mobile app and the dashboard's provider name/logo — just not its palette.
 */
export function resolveTheme(): Theme {
  return lightTheme
}

function SessionSplash() {
  const theme = useTheme()
  const { t } = useTranslation()
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.color.background,
        color: theme.color.textMuted,
      }}
    >
      {t('app.loading')}
    </div>
  )
}

function Root() {
  const dispatch = useAppDispatch()
  const token = useAppSelector((s) => s.auth.token)
  // Validate the persisted token against the server on boot. A revoked/expired
  // token must not drop the user straight into the dashboard — verify first, then
  // refresh branding from the server (keeps the theme current) or force logout.
  const { data, isLoading, isError } = useMeQuery(undefined, { skip: !token })

  useEffect(() => {
    if (token && isError) dispatch(logout())
  }, [token, isError, dispatch])

  useEffect(() => {
    if (data?.branding) dispatch(setBranding(data.branding))
  }, [data, dispatch])

  if (!token) return <AuthScreen />
  if (isLoading) return <SessionSplash />
  if (isError) return <AuthScreen />
  return <DashboardLayout />
}

function ThemedApp() {
  return (
    <ThemeProvider theme={resolveTheme()}>
      <ToastProvider>
        <Root />
      </ToastProvider>
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
