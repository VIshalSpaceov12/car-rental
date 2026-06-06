import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { Provider } from 'react-redux'
import { ThemeProvider, useTheme, defaultTheme } from '@car-rental/tokens'
import { store } from './src/store/store'
import { useAppDispatch, useAppSelector } from './src/store/hooks'
import { hydrate } from './src/store/authSlice'
import { loadAuth } from './src/storage/authStorage'
import { AuthScreen } from './src/features/auth/AuthScreen'
import { AppNavigator } from './src/navigation/AppNavigator'

function Root() {
  const theme = useTheme()
  const dispatch = useAppDispatch()
  const { token, hydrated } = useAppSelector((s) => s.auth)

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

  return (
    <>
      {token ? <AppNavigator /> : <AuthScreen />}
      <StatusBar style="auto" />
    </>
  )
}

export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={defaultTheme}>
        <Root />
      </ThemeProvider>
    </Provider>
  )
}
