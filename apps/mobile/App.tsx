import { useEffect, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Provider } from 'react-redux'
import { ThemeProvider, createTheme, darkTheme, useTheme, type Theme } from '@car-rental/tokens'
import './src/i18n'
import { store } from './src/store/store'
import { useAppDispatch, useAppSelector } from './src/store/hooks'
import { hydrate } from './src/store/authSlice'
import { useBrandingQuery } from './src/store/authApi'
import { loadAuth } from './src/storage/authStorage'
import { OnboardingScreen } from './src/features/onboarding/OnboardingScreen'
import { AuthScreen } from './src/features/auth/AuthScreen'
import { AppNavigator } from './src/navigation/AppNavigator'

function Root() {
  const theme = useTheme()
  const dispatch = useAppDispatch()
  const { token, hydrated } = useAppSelector((s) => s.auth)
  const [started, setStarted] = useState(false)

  // Restore a persisted session on launch before deciding which screen to show.
  useEffect(() => {
    loadAuth().then((auth) => dispatch(hydrate(auth)))
  }, [dispatch])

  if (!hydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: theme.color.background }}>
        <ActivityIndicator color={theme.color.primary} />
      </View>
    )
  }

  let content
  if (token) content = <AppNavigator />
  else if (!started) content = <OnboardingScreen onGetStarted={() => setStarted(true)} />
  else content = <AuthScreen />

  return (
    <>
      {content}
      <StatusBar style="light" />
    </>
  )
}

/**
 * Resolve the single-brand theme at runtime: fetch the provider's white-label
 * `branding` and overlay its colors onto the dark scheme via `createTheme`.
 * Falls back to `darkTheme` while loading or when no branding is configured.
 */
function Branded() {
  const { data: branding } = useBrandingQuery()

  const theme: Theme = branding
    ? createTheme(darkTheme.color, {
        primary: branding.colors.primary,
        ...(branding.colors.primaryDark ? { primaryDark: branding.colors.primaryDark } : {}),
        ...(branding.colors.background ? { background: branding.colors.background } : {}),
      })
    : darkTheme

  return (
    <ThemeProvider theme={theme}>
      <Root />
    </ThemeProvider>
  )
}

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <Branded />
      </SafeAreaProvider>
    </Provider>
  )
}
