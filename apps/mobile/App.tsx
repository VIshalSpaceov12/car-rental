import { useEffect, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Provider } from 'react-redux'
import { ThemeProvider, minimalTheme, useTheme } from '@car-rental/tokens'
import { initLocaleFromStorage } from './src/i18n'
import { store } from './src/store/store'
import { useAppDispatch, useAppSelector } from './src/store/hooks'
import { hydrate } from './src/store/authSlice'
import { useBrandingQuery } from './src/store/authApi'
import { loadAuth } from './src/storage/authStorage'
import { OnboardingScreen } from './src/features/onboarding/OnboardingScreen'
import { AuthScreen } from './src/features/auth/AuthScreen'
import { AppNavigator } from './src/navigation/AppNavigator'
import { ToastProvider } from './src/components/Toast'

function Root() {
  const theme = useTheme()
  const dispatch = useAppDispatch()
  const { token, hydrated } = useAppSelector((s) => s.auth)
  const [started, setStarted] = useState(false)

  // Restore a persisted session on launch before deciding which screen to show.
  useEffect(() => {
    loadAuth().then((auth) => dispatch(hydrate(auth)))
  }, [dispatch])

  // Apply the user's persisted language choice over the device default.
  useEffect(() => {
    void initLocaleFromStorage()
  }, [])

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
 * The customer app renders a FIXED "Electric Aurora" dark theme (`minimalTheme` —
 * see `minimal.ts`), the same for every tenant — colors are no longer overlaid from
 * the provider brand (mirrors the dashboard's fixed admin theme). We still warm the
 * `branding` fetch so name/logo consumers (e.g. Settings) read it from cache.
 */
function Branded() {
  useBrandingQuery()

  // ToastProvider sits inside ThemeProvider/SafeAreaProvider so toasts resolve
  // theme colors + safe-area insets, yet is high enough for any screen to fire one.
  return (
    <ThemeProvider theme={minimalTheme}>
      <ToastProvider>
        <Root />
      </ToastProvider>
    </ThemeProvider>
  )
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <SafeAreaProvider>
          <Branded />
        </SafeAreaProvider>
      </Provider>
    </GestureHandlerRootView>
  )
}
