import { useEffect, useMemo } from 'react'
import { Provider } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { ThemeProvider, createTheme, lightTheme, darkTheme, useTheme, type Theme } from '@car-rental/tokens'
import type { ProviderBranding } from '@car-rental/types'
import './i18n'
import { store } from './store/store'
import { useAppDispatch, useAppSelector } from './store/hooks'
import { useMeQuery } from './store/authApi'
import { logout, setBranding } from './store/authSlice'
import { AuthScreen } from './features/auth/AuthScreen'
import { DashboardLayout } from './features/dashboard/DashboardLayout'

/** Perceived (sRGB-weighted) luminance test; unparseable colors read as light. */
function isDarkColor(hex: string): boolean {
  const hex6 = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim())?.[1]
  if (!hex6) return false
  const n = parseInt(hex6, 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.5
}

/**
 * Resolve the dashboard runtime theme from provider branding. The admin dashboard
 * is committed to the LIGHT neutral scheme (data-dense, legible — see `light.ts`),
 * so white-label rebrands the *hues* (primary), NOT the canvas. We deliberately do
 * not apply the provider's `background`/`text` neutrals here: a provider's dark
 * mobile-brand background (e.g. #0A0A0B) would otherwise sit under the light
 * scheme's near-black text and the UI would read as a blank canvas. `onPrimary`
 * flips by the primary's luminance so button labels stay legible on any brand hue.
 * Before login (no branding) we use the base `lightTheme`.
 */
export function resolveTheme(branding: ProviderBranding | null): Theme {
  if (!branding) return lightTheme
  const { primary, primaryDark } = branding.colors
  return createTheme(lightTheme.color, {
    primary,
    onPrimary: isDarkColor(primary) ? darkTheme.color.text : lightTheme.color.text,
    ...(primaryDark ? { primaryDark } : {}),
  })
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
